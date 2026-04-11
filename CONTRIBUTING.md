# Katkıda Bulunma Rehberi

Yurt'a katkıda bulunmak istediğiniz için teşekkürler!

## Nasıl Katkıda Bulunabilirim?

### Hata Bildirimi

1. [Issues](https://github.com/karemyazilim/yurt/issues) sayfasında benzer bir hata olup olmadığını kontrol edin
2. Yoksa "Hata Bildirimi" şablonuyla yeni bir issue açın
3. Hatayı yeniden üretme adımlarını detaylı yazın

### Özellik Önerisi

1. [Issues](https://github.com/karemyazilim/yurt/issues) sayfasında benzer bir öneri olup olmadığını kontrol edin
2. "Özellik İsteği" şablonuyla yeni bir issue açın

### Kod Katkısı

#### Geliştirme Ortamı

```bash
git clone https://github.com/karemyazilim/yurt.git
cd yurt
pnpm install
cp apps/dokploy/.env.example apps/dokploy/.env
```

#### Gereksinimler

- Node.js 24.4.0+
- pnpm 10.22.0+
- [Docker](/GUIDES.md#docker)

#### Kurulum

```bash
pnpm run yurt:setup
pnpm run server:script
pnpm run yurt:dev
```

http://localhost:3000 adresinden erişin.

#### Branch ve Commit

```bash
git checkout -b ozellik/yeni-ozellik
# veya
git checkout -b duzeltme/hata-aciklamasi
```

Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/) formatında:

```
feat: yeni özellik açıklaması
fix: hata düzeltme açıklaması
docs: dokümantasyon güncelleme
```

### Türkçeleştirme Katkısı

Türkçeleştirme en değerli katkı alanlarımızdan biridir:

- **Türkçe karakterler**: ş, ç, ğ, ı, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü her zaman doğru kullanılmalı
- **Tutarlılık**: Mevcut çevirilerdeki terminolojiyi takip edin
- **Sadece UI metinleri**: Değişken, fonksiyon adları ve CSS sınıfları değiştirilmemeli
- **Veritabanı enum değerleri**: `"Dokploy"` gibi enum değerleri değiştirilmemeli

#### Terim Sözlüğü

| İngilizce | Türkçe |
|-----------|--------|
| Deploy / Deployment | Dağıt / Dağıtım |
| Application | Uygulama |
| Environment | Ortam |
| Server | Sunucu |
| Domain | Alan Adı |
| Certificate | Sertifika |
| Backup | Yedekleme |
| Monitoring | İzleme |
| Notification | Bildirim |
| Settings | Ayarlar |
| Build | Derleme |
| Container | Konteyner |
| Schedule | Zamanlama |
| Permission | İzin |
| Tag | Etiket |

## Pull Request Kuralları

- Her PR tek bir konuya odaklansın
- Yerel ortamda test edilmiş olsun
- Büyük özellikler için önce issue açıp tartışın
- Ekran görüntüsü eklemek çok yardımcı olur

## Lisans

Katkılarınız Apache 2.0 lisansı altında lisanslanacaktır.
