import io
import os
import math
import zipfile
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ImageOps
from pypdf import PdfReader, PdfWriter

def resize_image(image: Image.Image, max_width: Optional[int] = None, max_height: Optional[int] = None, scale_factor: float = 1.0) -> Image.Image:
    """Resize image proportionally if dimensions exceed limits or scale factor is applied."""
    orig_w, orig_h = image.size
    target_w, target_h = int(orig_w * scale_factor), int(orig_h * scale_factor)
    
    if max_width and target_w > max_width:
        ratio = max_width / float(target_w)
        target_w = max_width
        target_h = int(float(target_h) * ratio)
        
    if max_height and target_h > max_height:
        ratio = max_height / float(target_h)
        target_h = max_height
        target_w = int(float(target_w) * ratio)
        
    target_w = max(1, target_w)
    target_h = max(1, target_h)

    if (target_w, target_h) != (orig_w, orig_h):
        return image.resize((target_w, target_h), Image.Resampling.LANCZOS)
    return image

def _encode_image(img: Image.Image, save_format: str, quality: int) -> bytes:
    """Internal helper to encode PIL image to bytes with specified format and quality."""
    output_io = io.BytesIO()
    
    if save_format == "JPEG":
        work_img = img
        if work_img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", work_img.size, (255, 255, 255))
            if work_img.mode == "P":
                work_img = work_img.convert("RGBA")
            background.paste(work_img, mask=work_img.split()[-1] if work_img.mode == "RGBA" else None)
            work_img = background
        elif work_img.mode != "RGB":
            work_img = work_img.convert("RGB")

        work_img.save(
            output_io,
            format="JPEG",
            quality=max(1, min(100, quality)),
            optimize=True,
            progressive=True
        )

    elif save_format == "PNG":
        if quality < 85:
            colors = max(16, int(256 * (quality / 100)))
            if img.mode == "RGBA":
                alpha = img.split()[3]
                rgb = img.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
                rgb = rgb.convert("RGBA")
                rgb.putalpha(alpha)
                rgb.save(output_io, format="PNG", optimize=True, compress_level=9)
            else:
                quantized = img.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
                quantized.save(output_io, format="PNG", optimize=True, compress_level=9)
        else:
            img.save(output_io, format="PNG", optimize=True, compress_level=9)

    elif save_format == "WEBP":
        img.save(
            output_io,
            format="WEBP",
            quality=max(1, min(100, quality)),
            method=6,
            optimize=True
        )

    elif save_format == "GIF":
        img.save(output_io, format="GIF", optimize=True)

    else:
        img.save(output_io, format=save_format, optimize=True)

    return output_io.getvalue()

def compress_image_target_size(
    img: Image.Image,
    save_format: str,
    target_max_bytes: int,
    target_min_bytes: Optional[int] = None
) -> Tuple[bytes, int]:
    """
    Adaptively compress image using binary search on quality and scale
    to achieve a file size <= target_max_bytes (and >= target_min_bytes if possible).
    """
    scale = 1.0
    best_bytes = b""
    best_quality = 75

    for attempt in range(4):
        scaled_img = resize_image(img, scale_factor=scale)
        
        # Binary search for optimal quality
        low_q, high_q = 15, 95
        local_best = None
        local_best_q = 75

        while low_q <= high_q:
            mid_q = (low_q + high_q) // 2
            encoded = _encode_image(scaled_img, save_format, mid_q)
            encoded_size = len(encoded)

            if encoded_size <= target_max_bytes:
                local_best = encoded
                local_best_q = mid_q
                # Try higher quality to see if it still fits
                low_q = mid_q + 1
            else:
                # Exceeded target max size, reduce quality
                high_q = mid_q - 1

        if local_best is not None:
            best_bytes = local_best
            best_quality = local_best_q
            break
        else:
            # Even lowest quality was too large, downscale image dimensions
            min_q_encoded = _encode_image(scaled_img, save_format, 15)
            curr_size = len(min_q_encoded)
            if curr_size > 0:
                scale_reduction = math.sqrt(target_max_bytes / curr_size) * 0.9
                scale *= max(0.2, min(0.9, scale_reduction))
            else:
                scale *= 0.7

    if not best_bytes:
        # Fallback to lowest possible scale and quality
        final_img = resize_image(img, scale_factor=scale)
        best_bytes = _encode_image(final_img, save_format, 20)
        best_quality = 20

    return best_bytes, best_quality

def compress_image(
    file_bytes: bytes,
    filename: str,
    quality: int = 75,
    target_format: str = "original",
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    target_max_kb: Optional[int] = None,
    target_min_kb: Optional[int] = None
) -> Tuple[bytes, str, str, Dict[str, Any]]:
    """
    Compress an image buffer and return (compressed_bytes, output_filename, mime_type, extra_meta).
    """
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if not ext:
        ext = "jpg"

    input_format_map = {
        "jpg": "JPEG",
        "jpeg": "JPEG",
        "png": "PNG",
        "webp": "WEBP",
        "gif": "GIF",
        "bmp": "BMP",
        "tiff": "TIFF",
        "tif": "TIFF",
    }
    
    img = Image.open(io.BytesIO(file_bytes))
    
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Resize if max dimensions provided
    img = resize_image(img, max_width, max_height)

    # Determine target format
    target_format_clean = target_format.lower()
    if target_format_clean in ["original", "auto", ""]:
        save_format = input_format_map.get(ext, "JPEG")
        out_ext = ext
    elif target_format_clean in ["jpeg", "jpg"]:
        save_format = "JPEG"
        out_ext = "jpg"
    elif target_format_clean == "png":
        save_format = "PNG"
        out_ext = "png"
    elif target_format_clean == "webp":
        save_format = "WEBP"
        out_ext = "webp"
    else:
        save_format = input_format_map.get(ext, "JPEG")
        out_ext = ext

    mime_type = f"image/{'jpeg' if out_ext in ['jpg', 'jpeg'] else out_ext}"
    final_quality = quality

    if target_max_kb and target_max_kb > 0:
        target_max_bytes = target_max_kb * 1024
        target_min_bytes = (target_min_kb * 1024) if (target_min_kb and target_min_kb > 0) else None
        compressed_bytes, final_quality = compress_image_target_size(
            img=img,
            save_format=save_format,
            target_max_bytes=target_max_bytes,
            target_min_bytes=target_min_bytes
        )
    else:
        compressed_bytes = _encode_image(img, save_format, quality)

    base_name = os.path.splitext(filename)[0]
    out_filename = f"{base_name}_comprimido.{out_ext}"

    # If original was already smaller, and format is original without target limit, preserve original
    if not target_max_kb and target_format_clean in ["original", "auto", ""] and len(compressed_bytes) > len(file_bytes):
        return file_bytes, filename, mime_type, {"quality_used": 100}

    return compressed_bytes, out_filename, mime_type, {"quality_used": final_quality}

def compress_pdf(file_bytes: bytes, filename: str, quality_preset: str = "medium", target_max_kb: Optional[int] = None) -> Tuple[bytes, str, str, Dict[str, Any]]:
    """
    Compress a PDF by compressing streams and re-encoding embedded images.
    """
    reader = PdfReader(io.BytesIO(file_bytes))
    writer = PdfWriter()

    img_quality_map = {
        "low": 35,
        "medium": 60,
        "high": 85
    }
    
    if target_max_kb and target_max_kb > 0:
        target_max_bytes = target_max_kb * 1024
        if len(file_bytes) > target_max_bytes * 2:
            img_quality = 30
        elif len(file_bytes) > target_max_bytes:
            img_quality = 45
        else:
            img_quality = 65
    else:
        img_quality = img_quality_map.get(quality_preset, 60)

    for page in reader.pages:
        page.compress_content_streams()
        try:
            for img_obj in page.images:
                try:
                    raw_img = Image.open(io.BytesIO(img_obj.data))
                    if raw_img.mode in ("RGBA", "P"):
                        raw_img = raw_img.convert("RGB")
                    img_buffer = io.BytesIO()
                    raw_img.save(img_buffer, format="JPEG", quality=img_quality, optimize=True)
                    img_obj.replace(img_buffer.getvalue())
                except Exception:
                    pass
        except Exception:
            pass

        writer.add_page(page)

    writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)

    output_io = io.BytesIO()
    writer.write(output_io)
    compressed_bytes = output_io.getvalue()

    base_name = os.path.splitext(filename)[0]
    out_filename = f"{base_name}_comprimido.pdf"
    
    if not target_max_kb and len(compressed_bytes) > len(file_bytes):
        return file_bytes, filename, "application/pdf", {"quality_used": img_quality}

    return compressed_bytes, out_filename, "application/pdf", {"quality_used": img_quality}

def compress_file_dispatch(
    file_bytes: bytes,
    filename: str,
    quality: int = 75,
    target_format: str = "original",
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    pdf_quality: str = "medium",
    target_max_kb: Optional[int] = None,
    target_min_kb: Optional[int] = None
) -> Dict[str, Any]:
    """
    Dispatch file to appropriate compressor and return result metadata + bytes.
    """
    orig_size = len(file_bytes)
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    
    image_extensions = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif"}
    
    if ext in image_extensions:
        compressed_bytes, out_filename, mime, meta = compress_image(
            file_bytes=file_bytes,
            filename=filename,
            quality=quality,
            target_format=target_format,
            max_width=max_width,
            max_height=max_height,
            target_max_kb=target_max_kb,
            target_min_kb=target_min_kb
        )
        file_type = "image"
    elif ext == "pdf":
        compressed_bytes, out_filename, mime, meta = compress_pdf(
            file_bytes=file_bytes,
            filename=filename,
            quality_preset=pdf_quality,
            target_max_kb=target_max_kb
        )
        file_type = "pdf"
    else:
        zip_io = io.BytesIO()
        with zipfile.ZipFile(zip_io, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
            zipf.writestr(filename, file_bytes)
        compressed_bytes = zip_io.getvalue()
        base_name = os.path.splitext(filename)[0]
        out_filename = f"{base_name}.zip"
        mime = "application/zip"
        file_type = "generic"
        meta = {}

    compressed_size = len(compressed_bytes)
    saved_bytes = orig_size - compressed_size
    percent_saved = round((saved_bytes / orig_size) * 100, 1) if orig_size > 0 else 0

    return {
        "original_filename": filename,
        "compressed_filename": out_filename,
        "original_size": orig_size,
        "compressed_size": compressed_size,
        "saved_bytes": saved_bytes,
        "percent_saved": percent_saved,
        "mime_type": mime,
        "file_type": file_type,
        "meta": meta,
        "bytes": compressed_bytes
    }
