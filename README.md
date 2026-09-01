# 🗜️ Vertio Comprimir (Docker)

**Vertio Comprimir** é um otimizador moderno, rápido e minimalista de imagens e arquivos, com controle preciso de tamanho alvo (KB/MB) ou qualidade, e suporte nativo aos temas **Dark** e **Light**.

---

## ✨ Recursos

- 🎯 **Compressão por Tamanho Alvo (KB / MB)**: Defina o tamanho máximo (limite) e mínimo desejado. O algoritmo ajusta de forma adaptativa a qualidade e dimensões para respeitar o limite solicitado.
- 🖼️ **Compressão de Imagens**: Suporte para `JPEG`, `PNG` (com quantização inteligente de paleta), `WebP`, `GIF`, `BMP` e `TIFF`.
- 📄 **Compressão de PDFs**: Otimização profunda de streams e imagens incorporadas.
- 🌓 **Temas Dark & Light**: Alternância suave e armazenamento automático de preferências.
- ⚡ **Conversão e Redimensionamento**:
  - Opção para converter formatos (ex: WebP para economizar até 80%).
  - Redimensionamento proporcional (largura máxima em pixels).
- 📦 **Download Individual e em Lote (.ZIP)**.
- 🔒 **100% Privado e Local**: Seus arquivos são processados diretamente no container Docker na sua máquina.

---

## 🚀 Como Executar com Docker (Porta 8088)

### Usando Docker Compose (Recomendado)

Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

Acesse no navegador:
👉 **[http://localhost:8088](http://localhost:8088)**

Para parar o container:
```bash
docker compose down
```

---

## 📁 Estrutura do Projeto

```
Comprimir/
├── app/
│   ├── compressor.py        # Algoritmos de compressão adaptativa e qualidade
│   ├── main.py              # API FastAPI
│   └── static/              # Interface Minimalista
│       ├── css/style.css    # Estilos e animações
│       ├── js/app.js        # Lógica de tamanho alvo, drag & drop e tema
│       ├── favicon.svg      # Ícone da aba do navegador
│       └── index.html       # UI responsiva
├── Dockerfile               # Imagem Docker (Python 3.11 na porta 8088)
├── docker-compose.yml       # Orquestração (Porta 8088:8088)
├── requirements.txt         # Dependências
└── README.md                # Documentação
```
