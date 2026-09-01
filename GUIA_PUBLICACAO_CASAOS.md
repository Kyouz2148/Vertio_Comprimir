# 📘 Guia Definitivo: Como Publicar Qualquer Docker na Loja do CasaOS

Este guia serve como um **manual passo a passo reutilizável** para você publicar qualquer aplicativo Docker que criar na loja oficial do **CasaOS** (ou na sua própria loja personalizada).

---

## 📋 Pré-requisitos
1. **Conta no Docker Hub** ([hub.docker.com](https://hub.docker.com)) — para hospedar a imagem pública.
2. **Conta no GitHub** ([github.com](https://github.com)) — para submeter o Pull Request.
3. **Docker Desktop com Buildx** instalado na sua máquina.

---

## 🛠️ FASE 1: Preparar e Testar o Docker Localmente

1. Garanta que seu projeto tenha um `Dockerfile` funcional e exponha uma porta fixa (ex: `8088`, `8080`, `3000`).
2. Teste localmente para garantir que o container inicializa sem erros:
   ```bash
   docker compose up --build -d
   ```
3. Acesse no navegador e confirme que a aplicação abre normalmente.

---

## 🚀 FASE 2: Compilar Multi-Arquitetura e Publicar no Docker Hub

> ⚠️ **IMPORTANTE:** O CasaOS roda tanto em computadores normais (**x86_64/amd64**) quanto em placas como Raspberry Pi e ZimaBoard (**ARM64/arm**). Por isso, **sempre gere a imagem para ambas as arquiteturas**.

1. **Faça login no Docker Hub pelo terminal:**
   ```bash
   docker login
   ```

2. **Crie e ative o construtor multi-plataforma (execute apenas uma vez na máquina):**
   ```bash
   docker buildx create --use --name casaos-builder
   docker buildx use casaos-builder
   ```

3. **Construa e envie para o Docker Hub em um único comando:**
   ```bash
   docker buildx build --platform linux/amd64,linux/arm64 -t SEU_USUARIO_DOCKER/NOME_DO_APP:latest --push .
   ```
   *(Exemplo real: `docker buildx build --platform linux/amd64,linux/arm64 -t kyouz2148/vertio-comprimir:latest --push .`)*

4. Verifique no [hub.docker.com](https://hub.docker.com) se as duas tags `amd64` e `arm64` aparecem na aba **Tags**.

---

## 📦 FASE 3: Criar os Arquivos do Pacote CasaOS

Crie uma pasta com o nome do seu app (ex: `Apps/nome-do-app/`) contendo 2 arquivos obrigatórios:
1. `docker-compose.yml`
2. `icon.svg` (ou `icon.png` de preferência 256x256 ou 512x512)

### 📄 Modelo Padrão do `docker-compose.yml` do CasaOS:

```yaml
name: nome-do-app
services:
  nome-do-app:
    image: SEU_USUARIO_DOCKER/NOME_DO_APP:latest
    container_name: nome-do-app
    restart: unless-stopped
    ports:
      - "PORTA_EXTERNA:PORTA_INTERNA"
    environment:
      - TZ=America/Sao_Paulo
    x-casaos:
      ports:
        - container: "PORTA_INTERNA"
          description:
            en_us: Web UI Port
            pt_br: Porta da Interface Web
      envs:
        - container: TZ
          description:
            en_us: Timezone
            pt_br: Fuso horário

x-casaos:
  architectures:
    - amd64
    - arm64
    - arm
  main: nome-do-app
  author: SeuNomeOuMarca
  category: Utilities   # Categorias: Utilities, Media, Home, Network, Productivity, etc.
  description:
    en_us: Description of your app in English (at least 2 lines).
    pt_br: Descrição do seu app em Português.
  developer: SeuNomeOuMarca
  icon: https://raw.githubusercontent.com/IceWhaleTech/CasaOS-AppStore/main/Apps/nome-do-app/icon.svg
  tagline:
    en_us: Short punchy slogan (1 line)
    pt_br: Slogan curto do aplicativo (1 linha)
  title:
    en_us: Nome do App
    pt_br: Nome do App
  port_map: "PORTA_EXTERNA"
  index: /
  scheme: http
```

---

## 🌐 FASE 4: Submeter para a Loja Oficial (IceWhaleTech/CasaOS-AppStore)

Para que o app apareça nativamente para todos os usuários do CasaOS no mundo:

1. **Faça o Fork do repositório oficial da loja:**
   - Acesse: [https://github.com/IceWhaleTech/CasaOS-AppStore/fork](https://github.com/IceWhaleTech/CasaOS-AppStore/fork)
   - Clique em **Create fork**.

2. **Adicione a pasta do seu app dentro de `Apps/`:**
   - No seu fork, entre na pasta **`Apps/`**.
   - Clique em **Add file** ➔ **Create new file**.
   - Nome do arquivo: `Apps/nome-do-app/docker-compose.yml`.
   - Cole o conteúdo do YAML configurado.
   - Faça o commit.
   - Adicione o ícone em `Apps/nome-do-app/icon.svg` ou `icon.png`.

3. **Abra o Pull Request (PR):**
   - Acesse: [https://github.com/IceWhaleTech/CasaOS-AppStore/compare](https://github.com/IceWhaleTech/CasaOS-AppStore/compare)
   - Clique em **Create pull request**.
   - **Título do PR:** `Add NomeDoApp app`
   - **Corpo do PR:**
     ```markdown
     ### Summary
     Short description of what the app does.

     - **Docker Image**: `SEU_USUARIO_DOCKER/NOME_DO_APP:latest`
     - **Architectures**: `amd64`, `arm64`, `arm`
     - **Port**: `PORTA`
     - **Category**: `Utilities`
     ```

4. **Aguarde a validação:**
   - O bot de CI/CD do GitHub da IceWhale testará automaticamente se a imagem baixa e responde 200 OK.
   - A equipe do CasaOS fará o merge e o app entrará na AppStore!

---

## ⚡ FASE 5 (BÔNUS): Como Testar Antes da Aprovação

Você não precisa esperar o PR ser aceito para usar seu app no seu CasaOS:

### Método A: Instalação Manual (Custom Install)
1. No seu CasaOS, abra a **AppStore**.
2. Clique no botão superior direito **Custom Install**.
3. Cole o conteúdo do `docker-compose.yml` da pasta `Apps/nome-do-app/`.
4. Clique em **Install** e ele começará a rodar imediatamente.

### Método B: Ter sua Própria AppStore Pessoal
1. Crie um repositório no seu GitHub chamado `minha-casaos-appstore`.
2. Coloque seus apps dentro da pasta `Apps/nome-do-app/...`.
3. No painel do seu CasaOS, vá em **AppStore** ➔ **More Apps** ➔ Cole o link do seu repositório GitHub.
4. Todos os seus apps personalizados aparecerão em uma aba exclusiva na sua loja!

---

## ⏱️ Checklist Rápido para Próximos Projetos (5 Minutos)

- [ ] Dockerfile criado e testado localmente.
- [ ] `docker login` realizado.
- [ ] Build multi-arquitetura enviado: `docker buildx build --platform linux/amd64,linux/arm64 -t usuario/app:latest --push .`
- [ ] `Apps/app/docker-compose.yml` criado com `x-casaos`.
- [ ] Ícone adicionado (`icon.svg` ou `icon.png`).
- [ ] PR aberto em `IceWhaleTech/CasaOS-AppStore`.
