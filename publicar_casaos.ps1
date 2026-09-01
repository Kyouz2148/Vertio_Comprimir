# Script de automação para publicar o Vertio Comprimir no CasaOS AppStore
param(
    [Parameter(Mandatory=$false)]
    [string]$DockerUser,

    [Parameter(Mandatory=$false)]
    [string]$GithubUser
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Publicador do Vertio Comprimir CasaOS  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Obter usuário Docker Hub
if (-not $DockerUser) {
    $DockerUser = Read-Host "Digite o seu nome de usuário do Docker Hub (ex: seu_usuario)"
}

if (-not $DockerUser) {
    Write-Host "Erro: Nome de usuário do Docker Hub é obrigatório." -ForegroundColor Red
    exit 1
}

$ImageTag = "$DockerUser/vertio-comprimir:latest"

# 2. Verificar Login no Docker Hub
Write-Host "`n[1/3] Verificando login no Docker Hub..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao autenticar no Docker Hub." -ForegroundColor Red
    exit 1
}

# 3. Construir e Enviar Imagem Multi-Arquitetura
Write-Host "`n[2/3] Construindo imagem multi-plataforma (linux/amd64, linux/arm64) e enviando para $ImageTag..." -ForegroundColor Yellow

# Criar builder se não existir
docker buildx create --use --name vertio-builder 2>$null
docker buildx use vertio-builder 2>$null

docker buildx build --platform linux/amd64,linux/arm64 -t $ImageTag --push .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro durante o build/push da imagem Docker." -ForegroundColor Red
    exit 1
}

Write-Host "Imagem $ImageTag publicada com sucesso no Docker Hub!" -ForegroundColor Green

# 4. Atualizar o docker-compose.yml do CasaOS
Write-Host "`n[3/3] Atualizando os arquivos do pacote CasaOS com a sua imagem..." -ForegroundColor Yellow

$composePath = "$PSScriptRoot\casaos\docker-compose.yml"
$composeContent = Get-Content $composePath -Raw
$composeContent = $composeContent -replace 'image:.*', "image: $ImageTag"
Set-Content -Path $composePath -Value $composeContent -Encoding UTF8

Write-Host "`n==========================================================================" -ForegroundColor Green
Write-Host "  TUDO PRONTO PARA O PULL REQUEST!                                        " -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Sua imagem pública já está no ar: https://hub.docker.com/r/$DockerUser/vertio-comprimir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora, para submeter na loja oficial do CasaOS:" -ForegroundColor Yellow
Write-Host "1. Abra: https://github.com/IceWhaleTech/CasaOS-AppStore/fork" -ForegroundColor White
Write-Host "2. No seu fork, vá em 'Apps/' e adicione a pasta 'vertio-comprimir/' contendo:" -ForegroundColor White
Write-Host "   - casaos/docker-compose.yml" -ForegroundColor White
Write-Host "   - casaos/icon.svg" -ForegroundColor White
Write-Host "3. Abra o Pull Request em https://github.com/IceWhaleTech/CasaOS-AppStore/compare" -ForegroundColor White
Write-Host ""
