<div align="center">
  <h1>Yurt</h1>
  <p><strong>Kendi sunucunuzda barındırabileceğiniz, açık kaynak PaaS platformu</strong></p>
  <p>Vercel, Heroku ve Netlify'a Türkçe alternatif</p>
  <p>
    <a href="#hızlı-başlangıç">Kurulum</a> •
    <a href="#özellikler">Özellikler</a> •
    <a href="#güvenlik-iyileştirmeleri">Güvenlik</a> •
    <a href="#katkıda-bulunun">Katkı</a>
  </p>
  <p>
    <a href="https://github.com/karemyazilim/yurt/stargazers"><img src="https://img.shields.io/github/stars/karemyazilim/yurt?style=social" alt="GitHub Stars"></a>
    <a href="https://github.com/karemyazilim/yurt/blob/main/LICENSE.MD"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License"></a>
    <a href="https://github.com/karemyazilim/yurt/issues"><img src="https://img.shields.io/github/issues/karemyazilim/yurt" alt="Issues"></a>
  </p>
</div>

---

## Yurt Nedir?

Yurt, [Dokploy](https://github.com/dokploy/dokploy) tabanlı, **Türkçe arayüzlü**, güvenlik yamaları uygulanmış, açık kaynak bir **self-hosted PaaS** (Platform as a Service) çözümüdür. VPS sunucunuza tek komutla kurulur ve uygulamalarınızı Vercel, Heroku veya Netlify'a ihtiyaç duymadan yönetmenizi sağlar.

**Neden Yurt?**
- Verileriniz sizde kalır — üçüncü parti bağımlılığı yok
- Türkçe arayüz — Türk geliştiriciler ve ekipler için
- Netgsm SMS bildirimleri — Türkiye'ye özel entegrasyon
- Güvenlik öncelikli — 6 kritik güvenlik yaması uygulandı
- Ücretsiz ve açık kaynak (Apache 2.0)

## Özellikler

### Uygulama Dağıtımı
- **Her Dil**: Node.js, PHP, Python, Go, Ruby, Java ve daha fazlası
- **Docker Compose**: Karmaşık çoklu konteyner uygulamalar
- **Otomatik SSL**: Traefik ile Let's Encrypt sertifikaları
- **Tek Tık Şablonlar**: Plausible, Pocketbase, Calcom, WordPress ve 50+ şablon

### Veritabanı Yönetimi
- **Desteklenen**: PostgreSQL, MySQL, MongoDB, MariaDB, Redis, libSQL
- **Otomatik Yedekleme**: S3 uyumlu depolama hedeflerine zamanlanmış yedekler
- **Birim Yedekleme**: Docker volume'larının yedeklenmesi

### Altyapı
- **Çoklu Sunucu**: Docker Swarm ile yatay ölçeklendirme
- **Gerçek Zamanlı İzleme**: CPU, bellek, disk, ağ metrikleri
- **Traefik**: Otomatik yönlendirme, yük dengeleme, SSL
- **CLI ve REST API**: Tam programatik erişim

### Bildirimler
- Slack, Discord, Telegram, E-posta, Gotify, Ntfy, Mattermost, Teams, Lark, Pushover
- **Netgsm SMS** — Türkiye'ye özel SMS bildirimleri

### Türkçe Arayüz
- Giriş, kayıt, kontrol paneli tamamen Türkçe
- Bildirim ve e-posta şablonları Türkçe
- Sidebar, ayarlar, tüm menüler Türkçe

## Hızlı Başlangıç

VPS sunucunuzda (Ubuntu/Debian/CentOS) root olarak çalıştırın:

```bash
curl -sSL https://raw.githubusercontent.com/karemyazilim/yurt/main/install.sh | bash
```

**Gereksinimler:**
- Linux VPS (minimum 1 CPU, 1 GB RAM)
- Root erişimi
- 80, 443 ve 3000 portları açık

Kurulum tamamlandıktan sonra `http://SUNUCU_IP:3000` adresinden yönetim paneline erişin.

## Güvenlik İyileştirmeleri

Yurt, orijinal Dokploy'a ek olarak şu güvenlik yamalarını içerir:

| Yama | Seviye | Açıklama |
|------|--------|----------|
| Auth secret koruması | Kritik | Hardcoded `BETTER_AUTH_SECRET` fallback kaldırıldı |
| Kriptografik parola üretimi | Yüksek | `Math.random()` yerine `crypto.randomBytes()` |
| SSH command injection | Yüksek | Shell-escape ile güvenli komut çalıştırma |
| WebSocket tenant isolation | Orta | Organizasyon seviyesinde sunucu erişim kontrolü |
| Güvenli kurulum | Orta | `chmod 750`, Docker Secrets, Redis şifreli |
| Hardcoded şifre temizliği | Orta | `.env.example`'dan varsayılan şifre kaldırıldı |

## Karşılaştırma

| Özellik | Yurt | Vercel | Heroku | Coolify |
|---------|------|--------|--------|---------|
| Self-hosted | Evet | Hayır | Hayır | Evet |
| Türkçe arayüz | Evet | Hayır | Hayır | Hayır |
| Ücretsiz | Evet | Sınırlı | Sınırlı | Evet |
| SMS bildirimi (Netgsm) | Evet | Hayır | Hayır | Hayır |
| Docker Swarm | Evet | Hayır | Hayır | Hayır |
| Açık kaynak | Evet | Hayır | Hayır | Evet |

## Geliştirme

```bash
# Repoyu klonlayın
git clone https://github.com/karemyazilim/yurt.git
cd yurt

# Bağımlılıkları kurun
pnpm install

# Geliştirme sunucusunu başlatın
pnpm dokploy:dev

# Build
pnpm dokploy:build
```

## Teknoloji Yığını

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: tRPC, better-auth, Drizzle ORM
- **Veritabanı**: PostgreSQL, Redis
- **Altyapı**: Docker Swarm, Traefik
- **Dil**: TypeScript, Go (izleme servisi)

## Lisans

Apache License 2.0 — Orijinal [Dokploy](https://github.com/dokploy/dokploy) projesi temel alınmıştır.

## Katkıda Bulunun

Katkılarınızı bekliyoruz!

1. Bu repoyu fork edin
2. Feature branch oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: yeni ozellik ekle'`)
4. Branch'i push edin (`git push origin ozellik/yeni-ozellik`)
5. Pull Request açın

## Yol Haritası

- [ ] Tam i18n altyapısı (next-intl)
- [ ] Türkçe dokümantasyon sitesi
- [ ] Tüm dashboard sayfalarının Türkçeleştirilmesi
- [ ] Netgsm SMS frontend UI bileşeni
- [ ] Türkçe e-posta şablonları
- [ ] Docker Hub'da hazır imaj

---

<div align="center">
  <p>Verileriniz sizde kalsın.</p>
  <p>
    <a href="https://github.com/karemyazilim/yurt/issues">Hata Bildir</a> •
    <a href="https://github.com/karemyazilim/yurt/issues">Özellik İste</a>
  </p>
</div>
