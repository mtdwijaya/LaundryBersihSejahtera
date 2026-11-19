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
export const BEP_KG = 1700;
export const TARGET_PROFIT_KG = 2700;

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
