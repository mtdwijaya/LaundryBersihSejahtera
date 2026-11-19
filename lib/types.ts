export type OrderStatus = "diterima" | "dicuci" | "selesai" | "diambil";
export type PaymentStatus = "belum_bayar" | "sebagian" | "lunas";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

export type Order = {
  id: string;
  notaNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  weightKg: number;
  pricePerKg: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  weightKg: number;
  notes?: string;
};
