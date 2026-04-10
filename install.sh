#!/bin/bash
# Yurt — Güvenli self-hosted PaaS kurulum scripti
# Dokploy fork'u: https://github.com/karemyazilim/dokploy
# Lisans: Apache 2.0

set -euo pipefail

# ── Renk kodları ─────────────────────────────────────────────
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m"

log_info()  { printf "${BLUE}[INFO]${NC}  %s\n" "$1"; }
log_ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
log_warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
log_error() { printf "${RED}[ERROR]${NC} %s\n" "$1" >&2; }

# ── Versiyon tespiti ─────────────────────────────────────────
detect_version() {
    local version="${DOKPLOY_VERSION:-}"
    if [ -z "$version" ]; then
        log_info "GitHub'dan son kararlı sürüm tespit ediliyor..."
        version=$(curl -fsSL -o /dev/null -w '%{url_effective}\n' \
            https://github.com/dokploy/dokploy/releases/latest 2>/dev/null | \
            sed 's#.*/tag/##')
        if [ -z "$version" ]; then
            log_warn "Sürüm tespit edilemedi, 'latest' kullanılıyor"
            version="latest"
        else
            log_ok "Sürüm tespit edildi: $version"
        fi
    fi
    echo "$version"
}

# ── Proxmox LXC tespiti ─────────────────────────────────────
is_proxmox_lxc() {
    [ -n "${container:-}" ] && [ "$container" = "lxc" ] && return 0
    grep -q "container=lxc" /proc/1/environ 2>/dev/null && return 0
    return 1
}

# ── Güvenli parola üretimi (kriptografik) ────────────────────
generate_secure_password() {
    local length="${1:-32}"
    local password=""

    if command -v openssl >/dev/null 2>&1; then
        password=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-"$length")
    elif [ -r /dev/urandom ]; then
        password=$(tr -dc 'A-Za-z0-9!@#%^&*' < /dev/urandom | head -c "$length")
    else
        log_error "Güvenli rastgele parola üretilemedi — openssl veya /dev/urandom gerekli"
        exit 1
    fi

    if [ -z "$password" ] || [ ${#password} -lt 20 ]; then
        log_error "Parola üretimi başarısız"
        exit 1
    fi
    echo "$password"
}

# ── IP tespiti ───────────────────────────────────────────────
get_ip() {
    local ip=""
    for endpoint in https://ifconfig.io https://icanhazip.com https://ipecho.net/plain; do
        ip=$(curl -4s --connect-timeout 5 "$endpoint" 2>/dev/null) && [ -n "$ip" ] && break
    done
    if [ -z "$ip" ]; then
        for endpoint in https://ifconfig.io https://icanhazip.com https://ipecho.net/plain; do
            ip=$(curl -6s --connect-timeout 5 "$endpoint" 2>/dev/null) && [ -n "$ip" ] && break
        done
    fi
    if [ -z "$ip" ]; then
        log_error "Sunucu IP adresi tespit edilemedi. ADVERTISE_ADDR ortam değişkenini ayarlayın."
        exit 1
    fi
    echo "$ip"
}

get_private_ip() {
    ip addr show | grep -E "inet (192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.)" | head -n1 | awk '{print $2}' | cut -d/ -f1
}

format_ip_for_url() {
    local ip="$1"
    if echo "$ip" | grep -q ':'; then
        echo "[${ip}]"
    else
        echo "${ip}"
    fi
}

# ── Ön kontroller ───────────────────────────────────────────
preflight_checks() {
    if [ "$(id -u)" != "0" ]; then
        log_error "Bu script root olarak çalıştırılmalıdır"
        exit 1
    fi

    if [ "$(uname)" = "Darwin" ]; then
        log_error "Bu script Linux üzerinde çalıştırılmalıdır"
        exit 1
    fi

    if [ -f /.dockerenv ]; then
        log_error "Docker container içinden çalıştırılamaz"
        exit 1
    fi

    for port in 80 443 3000; do
        if ss -tulnp | grep ":${port} " >/dev/null; then
            log_error "Port ${port} zaten kullanımda"
            exit 1
        fi
    done
    log_ok "Port kontrolleri başarılı (80, 443, 3000)"
}

# ── Ana kurulum ──────────────────────────────────────────────
install_yurt() {
    VERSION_TAG=$(detect_version)
    DOCKER_IMAGE="dokploy/dokploy:${VERSION_TAG}"
    log_info "Yurt kurulumu başlıyor (sürüm: ${VERSION_TAG})"

    preflight_checks

    # Docker kurulumu
    if command -v docker >/dev/null 2>&1; then
        log_ok "Docker zaten kurulu"
    else
        log_info "Docker kuruluyor..."
        curl -sSL https://get.docker.com | sh -s -- --version 28.5.0
    fi

    # Proxmox LXC kontrol
    endpoint_mode=""
    if is_proxmox_lxc; then
        log_warn "Proxmox LXC ortamı tespit edildi — --endpoint-mode dnsrr ekleniyor"
        endpoint_mode="--endpoint-mode dnsrr"
        sleep 3
    fi

    # Docker Swarm başlat
    docker swarm leave --force 2>/dev/null || true

    advertise_addr="${ADVERTISE_ADDR:-$(get_private_ip)}"
    if [ -z "$advertise_addr" ]; then
        log_error "Özel IP adresi tespit edilemedi. ADVERTISE_ADDR ortam değişkenini ayarlayın."
        exit 1
    fi
    log_info "Advertise adresi: $advertise_addr"

    swarm_init_args="${DOCKER_SWARM_INIT_ARGS:-}"
    if [ -n "$swarm_init_args" ]; then
        docker swarm init --advertise-addr "$advertise_addr" $swarm_init_args
    else
        docker swarm init --advertise-addr "$advertise_addr"
    fi

    if [ $? -ne 0 ]; then
        log_error "Docker Swarm başlatılamadı"
        exit 1
    fi
    log_ok "Docker Swarm başlatıldı"

    # Ağ oluştur
    docker network rm -f dokploy-network 2>/dev/null || true
    docker network create --driver overlay --attachable dokploy-network
    log_ok "Overlay ağ oluşturuldu"

    # ── GÜVENLİK: Dizin izinleri (777 değil 750) ────────────
    mkdir -p /etc/dokploy
    chmod 750 /etc/dokploy
    log_ok "Konfigürasyon dizini oluşturuldu (750 izinleri)"

    # ── GÜVENLİK: Dinamik parola ve secret üretimi ─────────
    POSTGRES_PASSWORD=$(generate_secure_password 32)
    REDIS_PASSWORD=$(generate_secure_password 32)
    AUTH_SECRET=$(generate_secure_password 48)

    # Docker Secrets ile şifreli depolama
    echo "$POSTGRES_PASSWORD" | docker secret create dokploy_postgres_password - 2>/dev/null || true
    echo "$REDIS_PASSWORD" | docker secret create dokploy_redis_password - 2>/dev/null || true
    echo "$AUTH_SECRET" | docker secret create dokploy_auth_secret - 2>/dev/null || true
    log_ok "Tüm kimlik bilgileri güvenli şekilde oluşturuldu (Docker Secrets)"

    # PostgreSQL servisi
    docker service create \
        --name dokploy-postgres \
        --constraint 'node.role==manager' \
        --network dokploy-network \
        --env POSTGRES_USER=dokploy \
        --env POSTGRES_DB=dokploy \
        --secret source=dokploy_postgres_password,target=/run/secrets/postgres_password \
        --env POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password \
        --mount type=volume,source=dokploy-postgres,target=/var/lib/postgresql/data \
        $endpoint_mode \
        postgres:16

    # Redis servisi (şifreli)
    docker service create \
        --name dokploy-redis \
        --constraint 'node.role==manager' \
        --network dokploy-network \
        --secret source=dokploy_redis_password,target=/run/secrets/redis_password \
        --mount type=volume,source=dokploy-redis,target=/data \
        $endpoint_mode \
        redis:7 \
        sh -c 'redis-server --requirepass "$(cat /run/secrets/redis_password)"'

    # Yurt (Dokploy) ana servisi
    release_tag_env=""
    if [[ "$VERSION_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
        release_tag_env="-e RELEASE_TAG=latest"
    elif [ "$VERSION_TAG" != "latest" ]; then
        release_tag_env="-e RELEASE_TAG=$VERSION_TAG"
    fi

    docker service create \
        --name dokploy \
        --replicas 1 \
        --network dokploy-network \
        --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
        --mount type=bind,source=/etc/dokploy,target=/etc/dokploy \
        --mount type=volume,source=dokploy,target=/root/.docker \
        --secret source=dokploy_postgres_password,target=/run/secrets/postgres_password \
        --secret source=dokploy_redis_password,target=/run/secrets/redis_password \
        --secret source=dokploy_auth_secret,target=/run/secrets/auth_secret \
        --publish published=3000,target=3000,mode=host \
        --update-parallelism 1 \
        --update-order stop-first \
        --constraint 'node.role == manager' \
        $endpoint_mode \
        $release_tag_env \
        -e ADVERTISE_ADDR="$advertise_addr" \
        -e POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password \
        -e REDIS_PASSWORD_FILE=/run/secrets/redis_password \
        -e BETTER_AUTH_SECRET_FILE=/run/secrets/auth_secret \
        "$DOCKER_IMAGE"

    sleep 4

    # Traefik reverse proxy
    docker run -d \
        --name dokploy-traefik \
        --restart always \
        -v /etc/dokploy/traefik/traefik.yml:/etc/traefik/traefik.yml \
        -v /etc/dokploy/traefik/dynamic:/etc/dokploy/traefik/dynamic \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -p 80:80/tcp \
        -p 443:443/tcp \
        -p 443:443/udp \
        traefik:v3.6.7

    docker network connect dokploy-network dokploy-traefik

    # Sonuç
    public_ip="${ADVERTISE_ADDR:-$(get_ip)}"
    formatted_addr=$(format_ip_for_url "$public_ip")
    echo ""
    printf "${GREEN}Tebrikler! Yurt başarıyla kuruldu!${NC}\n"
    printf "${BLUE}Sunucunun başlaması için 15 saniye bekleyin${NC}\n"
    printf "${YELLOW}Yönetim paneli: http://${formatted_addr}:3000${NC}\n\n"
    printf "${RED}ÖNEMLİ: İlk giriş sonrası hemen yönetici şifrenizi değiştirin!${NC}\n"
    printf "${RED}ÖNEMLİ: Firewall ile 3000 portunu sadece güvenilir IP'lere açın!${NC}\n\n"
}

# ── Güncelleme ───────────────────────────────────────────────
update_yurt() {
    VERSION_TAG=$(detect_version)
    DOCKER_IMAGE="dokploy/dokploy:${VERSION_TAG}"
    log_info "Yurt güncelleniyor: ${VERSION_TAG}"
    docker pull "$DOCKER_IMAGE"
    docker service update --image "$DOCKER_IMAGE" dokploy
    log_ok "Yurt güncellendi: ${VERSION_TAG}"
}

# ── Ana çalıştırma ───────────────────────────────────────────
if [ "${1:-}" = "update" ]; then
    update_yurt
else
    install_yurt
fi
