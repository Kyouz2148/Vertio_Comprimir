document.addEventListener("DOMContentLoaded", () => {
  // --- Elements ---
  const html = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  
  // Step 1: Upload
  const stepUpload = document.getElementById("stepUpload");
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const selectedCountBadge = document.getElementById("selectedCountBadge");
  const selectedFilesBox = document.getElementById("selectedFilesBox");
  const selectedFilesList = document.getElementById("selectedFilesList");
  const changeFilesBtn = document.getElementById("changeFilesBtn");

  // Step 2 & 3: Options & Action
  const stepOptions = document.getElementById("stepOptions");
  const tabTargetSize = document.getElementById("tabTargetSize");
  const tabQuality = document.getElementById("tabQuality");
  const targetSizeControls = document.getElementById("targetSizeControls");
  const qualityControls = document.getElementById("qualityControls");
  const startCompressBtn = document.getElementById("startCompressBtn");
  const startCompressBtnText = document.getElementById("startCompressBtnText");

  // Target Size Inputs & Presets
  const sizePresetBtns = document.querySelectorAll(".size-preset-btn");
  const maxSizeInput = document.getElementById("maxSizeInput");
  const maxSizeUnit = document.getElementById("maxSizeUnit");
  const maxSizeDisplay = document.getElementById("maxSizeDisplay");
  const minSizeInput = document.getElementById("minSizeInput");
  const minSizeUnit = document.getElementById("minSizeUnit");
  const minSizeDisplay = document.getElementById("minSizeDisplay");
  const rangeMinLabel = document.getElementById("rangeMinLabel");
  const rangeMaxLabel = document.getElementById("rangeMaxLabel");
  const visualTargetBar = document.getElementById("visualTargetBar");

  // Quality Slider & Presets
  const qualityPresetBtns = document.querySelectorAll(".quality-preset-btn");
  const qualitySlider = document.getElementById("qualitySlider");
  const qualityVal = document.getElementById("qualityVal");

  // Format & Resize Options
  const targetFormat = document.getElementById("targetFormat");
  const maxWidth = document.getElementById("maxWidth");

  // Step 4: Loading & Results
  const loadingIndicator = document.getElementById("loadingIndicator");
  const loadingText = document.getElementById("loadingText");
  const resultsContainer = document.getElementById("resultsContainer");
  const fileList = document.getElementById("fileList");
  const summaryTitle = document.getElementById("summaryTitle");
  const summarySubtitle = document.getElementById("summarySubtitle");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const downloadAllBtn = document.getElementById("downloadAllBtn");

  let selectedFiles = [];
  let currentResults = [];
  let currentMode = "targetSize"; // "targetSize" | "quality"

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      html.classList.remove("dark");
    } else if (savedTheme === "dark") {
      html.classList.add("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    }
  }

  function toggleTheme() {
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }

  themeToggle.addEventListener("click", toggleTheme);
  initTheme();

  // --- Tab Switching ---
  tabTargetSize.addEventListener("click", () => {
    currentMode = "targetSize";
    tabTargetSize.classList.add("active", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "shadow-xs");
    tabTargetSize.classList.remove("text-zinc-600", "dark:text-zinc-400");

    tabQuality.classList.remove("active", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "shadow-xs");
    tabQuality.classList.add("text-zinc-600", "dark:text-zinc-400");

    targetSizeControls.classList.remove("hidden");
    qualityControls.classList.add("hidden");
  });

  tabQuality.addEventListener("click", () => {
    currentMode = "quality";
    tabQuality.classList.add("active", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "shadow-xs");
    tabQuality.classList.remove("text-zinc-600", "dark:text-zinc-400");

    tabTargetSize.classList.remove("active", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "shadow-xs");
    tabTargetSize.classList.add("text-zinc-600", "dark:text-zinc-400");

    targetSizeControls.classList.add("hidden");
    qualityControls.classList.remove("hidden");
  });

  // --- Target Size Logic ---
  function getTargetMaxKB() {
    const rawVal = parseFloat(maxSizeInput.value) || 500;
    return maxSizeUnit.value === "MB" ? Math.round(rawVal * 1024) : Math.round(rawVal);
  }

  function getTargetMinKB() {
    if (!minSizeInput.value) return null;
    const rawVal = parseFloat(minSizeInput.value);
    if (isNaN(rawVal) || rawVal <= 0) return null;
    return minSizeUnit.value === "MB" ? Math.round(rawVal * 1024) : Math.round(rawVal);
  }

  function updateSizeDisplay() {
    const maxKB = getTargetMaxKB();
    const formattedMax = maxKB >= 1024 ? `${(maxKB / 1024).toFixed(1)} MB` : `${maxKB} KB`;
    maxSizeDisplay.textContent = formattedMax;
    rangeMaxLabel.textContent = `Máx: ${formattedMax}`;

    const minKB = getTargetMinKB();
    if (minKB) {
      const formattedMin = minKB >= 1024 ? `${(minKB / 1024).toFixed(1)} MB` : `${minKB} KB`;
      minSizeDisplay.textContent = formattedMin;
      rangeMinLabel.textContent = `Min: ${formattedMin}`;
    } else {
      minSizeDisplay.textContent = "Automático";
      rangeMinLabel.textContent = "Min: 0 KB";
    }

    const barWidth = Math.min(100, Math.max(15, Math.round((maxKB / 2048) * 100)));
    visualTargetBar.style.width = `${barWidth}%`;
  }

  maxSizeInput.addEventListener("input", () => {
    const currentKB = getTargetMaxKB();
    sizePresetBtns.forEach(btn => {
      if (parseInt(btn.getAttribute("data-size-kb")) === currentKB) {
        btn.classList.add("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
        btn.classList.remove("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");
      } else {
        btn.classList.remove("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
        btn.classList.add("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");
      }
    });
    updateSizeDisplay();
  });

  maxSizeUnit.addEventListener("change", updateSizeDisplay);
  minSizeInput.addEventListener("input", updateSizeDisplay);
  minSizeUnit.addEventListener("change", updateSizeDisplay);

  sizePresetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sizePresetBtns.forEach(b => {
        b.classList.remove("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
        b.classList.add("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");
      });
      btn.classList.add("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
      btn.classList.remove("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");

      const sizeKB = parseInt(btn.getAttribute("data-size-kb"));
      if (sizeKB >= 1024) {
        maxSizeInput.value = (sizeKB / 1024).toFixed(0);
        maxSizeUnit.value = "MB";
      } else {
        maxSizeInput.value = sizeKB;
        maxSizeUnit.value = "KB";
      }
      updateSizeDisplay();
    });
  });

  // --- Quality Mode Logic ---
  qualityPresetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      qualityPresetBtns.forEach(b => {
        b.classList.remove("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
        b.classList.add("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");
      });
      btn.classList.add("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
      btn.classList.remove("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");

      const quality = btn.getAttribute("data-quality");
      qualitySlider.value = quality;
      qualityVal.textContent = `${quality}%`;
    });
  });

  qualitySlider.addEventListener("input", (e) => {
    const val = e.target.value;
    qualityVal.textContent = `${val}%`;

    qualityPresetBtns.forEach(btn => {
      if (btn.getAttribute("data-quality") === val) {
        btn.classList.add("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
        btn.classList.remove("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");
      } else {
        btn.classList.remove("active", "border-zinc-950", "dark:border-white", "bg-zinc-950", "dark:bg-white", "text-white", "dark:text-zinc-950", "font-bold");
        btn.classList.add("border-zinc-200", "dark:border-zinc-800", "bg-white", "dark:bg-zinc-900", "text-zinc-700", "dark:text-zinc-300");
      }
    });
  });

  // --- Step 1: File Selection & UI State ---
  dropZone.addEventListener("click", () => fileInput.click());
  changeFilesBtn.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      fileInput.value = "";
    }
  });

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function addFiles(fileListObj) {
    for (let i = 0; i < fileListObj.length; i++) {
      selectedFiles.push(fileListObj[i]);
    }
    renderSelectedFiles();
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderSelectedFiles();
  }

  function renderSelectedFiles() {
    selectedFilesList.innerHTML = "";

    if (selectedFiles.length === 0) {
      selectedCountBadge.classList.add("hidden");
      selectedFilesBox.classList.add("hidden");
      stepOptions.classList.add("hidden");
      dropZone.classList.remove("hidden");
      return;
    }

    selectedCountBadge.textContent = `${selectedFiles.length} arquivo(s)`;
    selectedCountBadge.classList.remove("hidden");
    selectedFilesBox.classList.remove("hidden");
    stepOptions.classList.remove("hidden");

    selectedFiles.forEach((file, idx) => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const iconName = isImg ? "image" : (isPdf ? "file-text" : "file");

      const item = document.createElement("div");
      item.className = "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between gap-3 text-xs";
      item.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <i data-lucide="${iconName}" class="w-4 h-4 text-zinc-500 shrink-0"></i>
          <span class="font-medium text-zinc-900 dark:text-zinc-100 truncate">${escapeHtml(file.name)}</span>
          <span class="text-zinc-400 dark:text-zinc-500 font-mono text-[11px] shrink-0">(${formatBytes(file.size)})</span>
        </div>
        <button type="button" data-remove-idx="${idx}" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 transition-colors" title="Remover">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      `;

      item.querySelector("button").addEventListener("click", () => removeFile(idx));
      selectedFilesList.appendChild(item);
    });

    const count = selectedFiles.length;
    startCompressBtnText.textContent = count === 1 ? "Comprimir 1 Arquivo" : `Comprimir ${count} Arquivos`;

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // --- Step 3: Trigger Compression Action ---
  startCompressBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
      alert("Por favor, selecione pelo menos um arquivo.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append("files", file));

    if (currentMode === "targetSize") {
      formData.append("target_max_kb", getTargetMaxKB());
      const minKB = getTargetMinKB();
      if (minKB) {
        formData.append("target_min_kb", minKB);
      }
    } else {
      formData.append("quality", qualitySlider.value);
    }

    formData.append("target_format", targetFormat.value);
    if (maxWidth.value && parseInt(maxWidth.value) > 0) {
      formData.append("max_width", maxWidth.value);
    }

    // UI Loading State
    stepUpload.classList.add("hidden");
    stepOptions.classList.add("hidden");
    resultsContainer.classList.add("hidden");
    loadingIndicator.classList.remove("hidden");
    loadingText.textContent = `Comprimindo ${selectedFiles.length} arquivo(s)...`;

    try {
      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success" && data.results) {
        currentResults = data.results;
        renderResults(data.results);
      }
    } catch (err) {
      alert("Falha ao comprimir arquivos: " + err.message);
      stepUpload.classList.remove("hidden");
      stepOptions.classList.remove("hidden");
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  });

  // --- Step 4: Render Results ---
  function renderResults(results) {
    fileList.innerHTML = "";
    resultsContainer.classList.remove("hidden");

    let totalOriginal = 0;
    let totalCompressed = 0;

    results.forEach((item) => {
      if (item.error) {
        const errorCard = document.createElement("div");
        errorCard.className = "bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300";
        errorCard.innerHTML = `
          <div class="flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4"></i>
            <span>${escapeHtml(item.original_filename)}: ${escapeHtml(item.error)}</span>
          </div>
        `;
        fileList.appendChild(errorCard);
        return;
      }

      totalOriginal += item.original_size;
      totalCompressed += item.compressed_size;

      const isReduced = item.saved_bytes > 0;
      const badgeClass = isReduced 
        ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-mono font-bold"
        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-mono";

      const badgeText = isReduced ? `-${item.percent_saved}%` : "0%";

      const card = document.createElement("div");
      card.className = "bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all";

      const iconName = item.file_type === "image" ? "image" : (item.file_type === "pdf" ? "file-text" : "file");

      let metaInfo = "";
      if (item.meta && item.meta.quality_used) {
        metaInfo = `<span class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">Q: ${item.meta.quality_used}%</span>`;
      }

      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
            <i data-lucide="${iconName}" class="w-4 h-4"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title="${escapeHtml(item.compressed_filename)}">
              ${escapeHtml(item.compressed_filename)}
            </p>
            <div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap font-mono">
              <span class="line-through text-zinc-400 dark:text-zinc-500">${formatBytes(item.original_size)}</span>
              <span>&rarr;</span>
              <span class="font-bold text-zinc-900 dark:text-zinc-100">${formatBytes(item.compressed_size)}</span>
              ${metaInfo}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 justify-end">
          <span class="px-2 py-0.5 rounded-md text-xs ${badgeClass}">
            ${badgeText}
          </span>
          <a 
            href="${item.download_url}" 
            download="${escapeHtml(item.compressed_filename)}"
            class="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Baixar arquivo"
          >
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Baixar</span>
          </a>
        </div>
      `;

      fileList.appendChild(card);
    });

    const totalSaved = totalOriginal - totalCompressed;
    const totalPercent = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;

    summaryTitle.textContent = `${results.length} arquivo(s) otimizado(s)`;
    if (totalSaved > 0) {
      summarySubtitle.textContent = `Economia de ${formatBytes(totalSaved)} (${totalPercent}% menor)`;
    } else {
      summarySubtitle.textContent = "Arquivos já no tamanho ideal.";
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // --- Batch Download as ZIP ---
  downloadAllBtn.addEventListener("click", async () => {
    const validIds = currentResults.filter(r => r.id).map(r => r.id);
    if (validIds.length === 0) return;

    if (validIds.length === 1) {
      window.location.href = currentResults[0].download_url;
      return;
    }

    const formData = new FormData();
    validIds.forEach(id => formData.append("file_ids", id));

    try {
      downloadAllBtn.disabled = true;
      downloadAllBtn.innerHTML = `
        <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
        <span>Gerando ZIP...</span>
      `;
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/download-zip", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Erro ao gerar ZIP");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vertio_comprimidos_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Falha no download em lote: " + err.message);
    } finally {
      downloadAllBtn.disabled = false;
      downloadAllBtn.innerHTML = `
        <i data-lucide="download" class="w-3.5 h-3.5"></i>
        <span>Baixar Todos (.zip)</span>
      `;
      if (window.lucide) lucide.createIcons();
    }
  });

  // --- Start Over / Clear All ---
  clearAllBtn.addEventListener("click", () => {
    selectedFiles = [];
    currentResults = [];
    resultsContainer.classList.add("hidden");
    stepOptions.classList.add("hidden");
    selectedFilesBox.classList.add("hidden");
    selectedCountBadge.classList.add("hidden");
    stepUpload.classList.remove("hidden");
    fileList.innerHTML = "";
    fileInput.value = "";
  });

  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, function(m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m];
    });
  }

  updateSizeDisplay();
});
