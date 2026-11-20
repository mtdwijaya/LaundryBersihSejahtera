export const BRAND = {
  name: "Laundry Bersih Sejahtera",
  shortName: "LBS",
  tagline: "Cuci rapi, pelanggan tenang.",
  address: "Jl. Raya Usaha No. 25, Palembang",
  phone: "0711-123-4567",
  hours: "Setiap hari 08.00–20.00",
};

export const PRICE_PER_KG = 8000;
export const FIXED_COST_MONTHLY = 8_500_000;
export const VARIABLE_COST_PER_KG = 3000;
export const CM_PER_KG = PRICE_PER_KG - VARIABLE_COST_PER_KG;
export const BEP_KG = 1700;
export const BEP_RUPIAH = 13_600_000;
export const TARGET_PROFIT_KG = 2700;
export const TARGET_PROFIT_RUPIAH = 5_000_000;
export const TARGET_REVENUE_RUPIAH = TARGET_PROFIT_KG * PRICE_PER_KG;

/** Angka kelayakan dari kasus makalah (statis untuk prototype). */
export const INVESTMENT = {
  initial: 25_000_000,
  paybackYears: 1.76,
  npv: 15_736_289,
  roiPercent: 100,
  yearlyNetCashflow: [12_000_000, 17_000_000, 21_000_000] as const,
};

export const STATUS_LABEL: Record<string, string> = {
  diterima: "Diterima",
  dicuci: "Dicuci",
  selesai: "Selesai",
  diambil: "Diambil",
};

export const PAYMENT_LABEL: Record<string, string> = {
  belum_bayar: "Belum bayar",
  sebagian: "Sebagian",
  lunas: "Lunas",
};

export const STATUS_FLOW = [
  "diterima",
  "dicuci",
  "selesai",
  "diambil",
] as const;
