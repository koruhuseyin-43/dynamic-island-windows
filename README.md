# 🏝️ Dynamic Island for Windows

macOS Dynamic Island deneyimini Windows'a taşıyan, Mochi maskotlu, tam özellikli bir masaüstü widget uygulaması.

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🕐 Canlı Saat | Üst ortada her zaman görünen saat |
| ⚙️ Kontrol Merkezi | Ses, parlaklık, zamanlayıcı, kafein modu |
| 📝 Hızlı Notlar | Otomatik kaydedilen not defteri |
| 📅 Takvim | Aylık takvim görünümü |
| 🎵 Medya Oynatıcı | Şarkı kontrolü + söz gösterimi |
| 🐾 Mochi Maskot | Animasyonlu maskot + dosya sürükle-bırak |
| 📧 E-posta Composer | Dosyayı sürükleyip direkt mail at |
| 🎨 Tema Seçici | 5 farklı renk teması |

## 🚀 Kurulum (SmartScreen uyarısı yok — kaynak kodu!)

### Gereksinimler
- [Node.js](https://nodejs.org) (v18+)

### Adımlar

```bash
# 1. Repoyu klonla
git clone https://github.com/KULLANICI_ADI/dynamic-island-windows.git
cd dynamic-island-windows

# 2. Bağımlılıkları yükle
npm install

# 3. Çalıştır
npm start
```

### Başlangıçta otomatik çalıştırma (Windows)
1. `Win + R` → `shell:startup` yaz
2. Klasörde sağ tıkla → Kısayol oluştur
3. Kısayolun hedefini şöyle yap:
   ```
   cmd /c "cd /d C:\PATH\TO\dynamic-island-windows && npm start"
   ```

## 🎮 Kullanım

| Eylem | Sonuç |
|-------|-------|
| Hap'a tıkla | Panel açılır/kapanır |
| `ESC` | Paneli kapatır |
| Dosya sürükle | Mochi sekmesine gider, dosyayı "yer" |
| Çift tıkla zamanlayıcı | Sıfırlar |
| Renk noktasına tıkla | Tema değişir |

## 📁 Proje Yapısı

```
dynamic-island-windows/
├── main.js       — Electron ana süreç
├── preload.js    — Güvenli IPC köprüsü
├── index.html    — UI yapısı
├── style.css     — Stil ve animasyonlar
├── renderer.js   — Etkileşim mantığı
└── package.json  — npm yapılandırması
```

## 🤝 Katkıda Bulun

Pull request'ler açıktır!

## 📄 Lisans

MIT — Özgürce kullan, paylaş.
