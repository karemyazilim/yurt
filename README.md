<div align="center">
  <h1>Yurt</h1>
  <p><strong>Kendi sunucunuzda barındırabileceğiniz, açık kaynak PaaS platformu</strong></p>
  <p>Vercel, Heroku ve Netlify'a Türkçe alternatif</p>
  <p><a href="https://github.com/dokploy/dokploy">Dokploy</a> fork'u — güvenlik yamaları ve Türkçe arayüz ile</p>
</div>

## Özellikler

- **Uygulamalar**: Her türlü uygulamayı dağıtın (Node.js, PHP, Python, Go, Ruby, vb.)
- **Veritabanları**: MySQL, PostgreSQL, MongoDB, MariaDB, libsql ve Redis desteği
- **Yedeklemeler**: Veritabanı yedeklerini harici depolamaya otomatik olarak alın
- **Docker Compose**: Karmaşık uygulamalar için yerel Docker Compose desteği
- **Çoklu Sunucu**: Docker Swarm ile uygulamalarınızı birden fazla sunucuya ölçeklendirin
- **Şablonlar**: Açık kaynak şablonları (Plausible, Pocketbase, Calcom, vb.) tek tıkla dağıtın
- **Traefik Entegrasyonu**: Yönlendirme ve yük dengeleme için otomatik Traefik entegrasyonu
- **Gerçek Zamanlı İzleme**: CPU, bellek, depolama ve ağ kullanımını izleyin
- **Bildirimler**: Slack, Discord, Telegram, E-posta ve **Netgsm SMS** ile bildirim alın
- **CLI/API**: Komut satırı veya API ile uygulamalarınızı yönetin
- **Türkçe Arayüz**: Tamamen Türkçeleştirilmiş kullanıcı arayüzü

## Hızlı Başlangıç

VPS sunucunuzda aşağıdaki komutu çalıştırın:

```bash
curl -sSL https://raw.githubusercontent.com/karemyazilim/dokploy/main/install.sh | bash
```

## Güvenlik İyileştirmeleri

Bu fork, orijinal Dokploy'a ek olarak şu güvenlik yamalarını içerir:

| Yama | Açıklama |
|------|----------|
| Kriptografik parola üretimi | `Math.random()` yerine `crypto.randomBytes()` |
| SSH command injection koruması | Shell-escape ile güvenli komut çalıştırma |
| WebSocket tenant isolation | Organizasyon seviyesinde sunucu erişim kontrolü |
| Güvenli install.sh | `chmod 750`, Docker Secrets, Redis şifreli |
| Hardcoded şifre temizliği | `.env.example`'dan varsayılan şifre kaldırıldı |

## Geliştirme

```bash
# Bağımlılıkları kur
pnpm install

# Geliştirme sunucusunu başlat
pnpm dokploy:dev

# Build
pnpm dokploy:build
```

## Lisans

Apache License 2.0 — Orijinal [Dokploy](https://github.com/dokploy/dokploy) projesi temel alınmıştır.

## Katkıda Bulunun

Pull request'ler kabul edilir! Lütfen önce bir issue açın.
