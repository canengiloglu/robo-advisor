import { describe, it, expect } from 'vitest';
import { rebalance } from './rebalance';
import type { Asset } from './rebalance';

// ── Yardımcı fabrika fonksiyonu ────────────────────────────────────────────
function asset(symbol: string, target: number, value: number): Asset {
  return { id: symbol, symbol, name: symbol, target_weight: target, current_value: value };
}

// Gerçek portföy verisini yansıtan 5 varlık (ALTIN = 0)
const REAL_ASSETS: Asset[] = [
  asset('TLY',   0.50,  155_072.87),
  asset('IJC',   0.125,  38_096.07),
  asset('AFT',   0.125,  28_885.85),
  asset('YJK',   0.10,   30_979.03),
  asset('ALTIN', 0.15,       0),
];

// ── 1. Normal senaryo ──────────────────────────────────────────────────────
describe('1. Normal senaryo — sadece açığı olanlar nakit alır', () => {
  const result = rebalance(REAL_ASSETS, 8_613.37);

  it('cash_added doğru set edilmeli', () => {
    expect(result.cash_added).toBe(8_613.37);
  });

  it('total_after = total_before + cash_added', () => {
    expect(result.total_after).toBeCloseTo(result.total_before + 8_613.37, 2);
  });

  it('TLY hedefi aşmış — allocation = 0 olmalı', () => {
    const tly = result.results.find((r) => r.symbol === 'TLY')!;
    // TLY mevcut ağırlığı ~%61, hedef %50 → açık yok
    expect(tly.allocation).toBe(0);
    expect(tly.deficit).toBe(0);
  });

  it('açığı olan varlıklara pozitif nakit dağıtılmalı', () => {
    const withAlloc = result.results.filter((r) => r.allocation > 0);
    expect(withAlloc.length).toBeGreaterThan(0);
    withAlloc.forEach((r) => expect(r.allocation).toBeGreaterThan(0));
  });
});

// ── 2. Tüm takip edilen varlıklar hedefi aşmış — nakit dağıtılamaz ────────
// Not: Bu senaryo yalnızca hedef ağırlıklar 1.0'a TOPLAMAMASI durumunda
// gerçekleşir (örn. portföyün %40'ı takip edilmeyen varlıklarda).
// A ve B yalnızca toplamın %60'ını hedefliyor; her ikisi de hedefini aşmış.
describe('2. Takip edilen tüm varlıklar hedefi aşmış (hedefler < 1.0 toplamı)', () => {
  const overweightAssets: Asset[] = [
    asset('A', 0.30, 400), // gerçek ağırlık %50 > hedef %30
    asset('B', 0.30, 400), // gerçek ağırlık %50 > hedef %30
    // Hedefler toplamı: 0.60 (kalan %40 takip edilmiyor)
  ];
  const result = rebalance(overweightAssets, 100);

  it('hiçbir varlığa nakit atanmamalı', () => {
    result.results.forEach((r) => expect(r.allocation).toBe(0));
  });

  it('tüm nakit unallocated olarak kalmalı', () => {
    expect(result.unallocated).toBeCloseTo(100, 5);
  });
});

// ── 3. Tek varlık açıkta — tüm nakit ona gitmeli ──────────────────────────
describe('3. Tek varlık açıkta', () => {
  const assets: Asset[] = [
    asset('X', 0.70, 700),   // hedefte
    asset('Y', 0.30,   0),   // tamamen açık
  ];
  const result = rebalance(assets, 200);

  it('Y tüm nakiti almalı', () => {
    const y = result.results.find((r) => r.symbol === 'Y')!;
    expect(y.allocation).toBeCloseTo(200, 5);
  });

  it('X hiç nakit almamalı', () => {
    const x = result.results.find((r) => r.symbol === 'X')!;
    expect(x.allocation).toBe(0);
  });

  it('unallocated = 0', () => {
    expect(result.unallocated).toBeCloseTo(0, 5);
  });
});

// ── 4. ALTIN %0, hedef %15 — en büyük açık olarak doğru hesaplansın ───────
describe('4. ALTIN sıfır değer, hedef %15', () => {
  const result = rebalance(REAL_ASSETS, 50_000);
  const altin = result.results.find((r) => r.symbol === 'ALTIN')!;

  it('ALTIN deficit > 0 olmalı', () => {
    expect(altin.deficit).toBeGreaterThan(0);
  });

  it('ALTIN en büyük allocation alan varlık olmalı', () => {
    const maxAlloc = Math.max(...result.results.map((r) => r.allocation));
    expect(altin.allocation).toBeCloseTo(maxAlloc, 1);
  });

  it('ALTIN yeni değeri > 0 olmalı', () => {
    expect(altin.new_value).toBeGreaterThan(0);
  });
});

// ── 5. Toplam dağıtılan nakit === girilen nakit ────────────────────────────
describe('5. Nakit korunumu — kuruş farkı olmamalı', () => {
  it('dağıtılan + unallocated = cash_added (8.613 TL)', () => {
    const result = rebalance(REAL_ASSETS, 8_613.37);
    const distributed = result.results.reduce((s, r) => s + r.allocation, 0);
    expect(distributed + result.unallocated).toBeCloseTo(result.cash_added, 5);
  });

  it('dağıtılan + unallocated = cash_added (50.000 TL)', () => {
    const result = rebalance(REAL_ASSETS, 50_000);
    const distributed = result.results.reduce((s, r) => s + r.allocation, 0);
    expect(distributed + result.unallocated).toBeCloseTo(result.cash_added, 5);
  });
});

// ── 6. Hiçbir varlığa negatif nakit atanmamalı ────────────────────────────
describe('6. Negatif allocation yasak', () => {
  it('tüm allocation değerleri >= 0 olmalı', () => {
    const result = rebalance(REAL_ASSETS, 8_613.37);
    result.results.forEach((r) => {
      expect(r.allocation).toBeGreaterThanOrEqual(0);
    });
  });

  it('deficit hiçbir zaman negatif olmamalı', () => {
    const result = rebalance(REAL_ASSETS, 8_613.37);
    result.results.forEach((r) => {
      expect(r.deficit).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── 7. Nakit = 0 — erken çıkış, hepsi unallocated ─────────────────────────
describe('7. Nakit = 0 girişi', () => {
  const result = rebalance(REAL_ASSETS, 0);

  it('tüm allocation = 0 olmalı', () => {
    result.results.forEach((r) => expect(r.allocation).toBe(0));
  });

  it('unallocated = 0 olmalı', () => {
    expect(result.unallocated).toBe(0);
  });

  it('total_after = total_before', () => {
    expect(result.total_after).toBe(result.total_before);
  });
});
