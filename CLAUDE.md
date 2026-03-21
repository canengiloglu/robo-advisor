# Robo-Advisor Portföy Dengeleme Asistanı

## Proje Tanımı
Bireysel yatırımcıların aylık "taze nakit" eklemelerini duygusuz matematikle yöneten bir SPA.
Hedef: Satış önermeden, eksik kalan varlıklara DCA (Kademeli Alım) yaparak portföyü dengelemek.
Gelecek plan: SaaS ürününe dönüştürme.

## Tech Stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS v3
- **Database:** Supabase (ücretsiz tier)
- **State:** Zustand
- **Routing:** React Router v6
- **Charts:** Recharts

## Geliştirme Komutları
```bash
npm run dev       # Geliştirme sunucusu (localhost:5173)
npm run build     # Production build
npm run preview   # Build önizleme
```

## Proje Yapısı
```
src/
├── components/
│   ├── Portfolio/       # Portföy tablosu, varlık satırları
│   ├── Rebalance/       # Algoritma sonuç ekranı
│   ├── Charts/          # Pasta grafik, dağılım görselleri
│   └── UI/              # Ortak bileşenler (Button, Input, Card...)
├── lib/
│   ├── rebalance.js     # ÇEKİRDEK ALGORİTMA — buraya dokunurken dikkat
│   └── supabase.js      # Supabase client
├── store/
│   └── portfolioStore.js # Zustand store
└── pages/
    └── Dashboard.jsx    # Ana sayfa
```

## ⚠️ Çekirdek Algoritma Kuralları (ASLA DEĞİŞTİRME)
`src/lib/rebalance.js` dosyasındaki algoritma şu adımları TAM olarak uygulamalıdır:

1. **Yeni Toplam** = `mevcutToplamDeger + eklenecekNakit`
2. **İdeal Değer** = her varlık için → `yeniToplam × hedefAgirlik`
3. **Açık (Deficit)** = `idealDeger - mevcutDeger`
   - Negatif sonuç → Açık = **0** (bu varlığa nakit gitmez)
4. **Dağıtım** = Nakit yalnızca açığı > 0 olan varlıklara, açık oranlarıyla orantılı dağıtılır

**Sistem hiçbir zaman SATIŞ önermez. Yalnızca ALIM önerir.**

## Varsayılan Test Verisi
| Sembol | Ad              | Hedef Ağırlık |
|--------|-----------------|---------------|
| TLY    | Serbest Fon     | %50           |
| IJC    | Çip Fonu        | %12.5         |
| AFT    | Yabancı Teknoloji | %12.5       |
| YJK    | Yerel Hisse     | %10           |
| ALTIN  | Altın (Sigorta) | %15           |

## Supabase Tablo Yapısı
```sql
-- portfolios tablosu
id uuid primary key default gen_random_uuid()
user_id uuid (ileride auth için)
name text
created_at timestamptz default now()

-- assets tablosu
id uuid primary key default gen_random_uuid()
portfolio_id uuid references portfolios(id)
symbol text
name text
target_weight numeric  -- 0.50, 0.125 gibi (yüzde değil, oran)
current_value numeric
created_at timestamptz default now()

-- rebalance_history tablosu
id uuid primary key default gen_random_uuid()
portfolio_id uuid references portfolios(id)
cash_added numeric
result_json jsonb  -- algoritma çıktısı snapshot
created_at timestamptz default now()
```

## Kodlama Standartları
- Türkçe yorum satırları kabul edilir
- Fonksiyon isimleri İngilizce
- `rebalance.js` için her değişiklikte birim testi yaz
- Component'lar küçük ve tek sorumluluklu olsun
- `console.log` production'a gitmesin (eslint ile kontrol)

## Tasarım Rehberi
- Minimalist, temiz, "finansal danışman SaaS" hissi
- Ana renkler: Koyu arka plan (#0f1117 benzeri) + beyaz metin + mavi/yeşil aksanlar
- Font: Profesyonel, geometric sans-serif
- Tablolar net, sayılar sağa hizalı, TL formatında gösterilmeli
