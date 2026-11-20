import { PRICE_PER_KG } from "@/lib/constants";
import type { Customer, Order, OrderStatus, PaymentStatus } from "@/lib/types";

export const initialCustomers: Customer[] = [
  {
    id: "cus-001",
    name: "Siti Rahma",
    phone: "0812-3456-7890",
    address: "Jl. Merdeka No. 12",
  },
  {
    id: "cus-002",
    name: "Budi Santoso",
    phone: "0813-9876-5432",
    address: "Komplek Melati Blok B2",
  },
  {
    id: "cus-003",
    name: "Ayu Lestari",
    phone: "0857-1122-3344",
    address: "Jl. Palembang Indah 8",
  },
  {
    id: "cus-004",
    name: "Rizky Pratama",
    phone: "0821-5566-7788",
    address: "Perumahan Anggrek No. 3",
  },
  {
    id: "cus-005",
    name: "Hotel Palembang Indah",
    phone: "0711-555-0101",
    address: "Jl. Jenderal Sudirman No. 88",
  },
  {
    id: "cus-006",
    name: "Klinik Sehat Sentosa",
    phone: "0711-555-0202",
    address: "Jl. Ahmad Yani No. 15",
  },
];

function order(input: {
  id: string;
  notaNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  weightKg: number;
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}): Order {
  const total = Math.round(input.weightKg * PRICE_PER_KG);
  const paidAmount = input.paidAmount ?? total;
  const paymentStatus =
    input.paymentStatus ??
    (paidAmount <= 0
      ? "belum_bayar"
      : paidAmount >= total
        ? "lunas"
        : "sebagian");

  return {
    id: input.id,
    notaNumber: input.notaNumber,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    weightKg: input.weightKg,
    pricePerKg: PRICE_PER_KG,
    total,
    paidAmount,
    paymentStatus,
    status: input.status,
    notes: input.notes ?? "",
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

/**
 * Total volume November = 1.700 kg (persis BEP).
 * Sebagian kecil untuk antrian operasional; sisanya sudah diambil (volume bulanan).
 */
export const initialOrders: Order[] = [
  // --- Antrian operasional ---
  order({
    id: "ord-001",
    notaNumber: "LBS-20261119-001",
    customerId: "cus-001",
    customerName: "Siti Rahma",
    customerPhone: "0812-3456-7890",
    weightKg: 4.5,
    status: "dicuci",
    notes: "Pisahkan baju putih",
    createdAt: "2026-11-19T01:00:00.000Z",
    updatedAt: "2026-11-19T02:00:00.000Z",
  }),
  order({
    id: "ord-002",
    notaNumber: "LBS-20261119-002",
    customerId: "cus-002",
    customerName: "Budi Santoso",
    customerPhone: "0813-9876-5432",
    weightKg: 6,
    paidAmount: 0,
    paymentStatus: "belum_bayar",
    status: "diterima",
    createdAt: "2026-11-19T03:00:00.000Z",
    updatedAt: "2026-11-19T03:00:00.000Z",
  }),
  order({
    id: "ord-003",
    notaNumber: "LBS-20261118-014",
    customerId: "cus-003",
    customerName: "Ayu Lestari",
    customerPhone: "0857-1122-3344",
    weightKg: 3.2,
    status: "selesai",
    notes: "Ambil sore",
    createdAt: "2026-11-18T07:00:00.000Z",
    updatedAt: "2026-11-19T04:00:00.000Z",
  }),
  order({
    id: "ord-004",
    notaNumber: "LBS-20261117-009",
    customerId: "cus-004",
    customerName: "Rizky Pratama",
    customerPhone: "0821-5566-7788",
    weightKg: 8,
    paidAmount: 30000,
    paymentStatus: "sebagian",
    status: "selesai",
    notes: "Bed cover + selimut",
    createdAt: "2026-11-17T02:00:00.000Z",
    updatedAt: "2026-11-18T09:00:00.000Z",
  }),
  order({
    id: "ord-007",
    notaNumber: "LBS-20261120-001",
    customerId: "cus-001",
    customerName: "Siti Rahma",
    customerPhone: "0812-3456-7890",
    weightKg: 3.3,
    paidAmount: 0,
    paymentStatus: "belum_bayar",
    status: "diterima",
    notes: "Express",
    createdAt: "2026-11-20T01:00:00.000Z",
    updatedAt: "2026-11-20T01:00:00.000Z",
  }),

  // --- Volume bulanan (sudah diambil) agar total = 1.700 kg ---
  // Subtotal antrian di atas: 4.5+6+3.2+8+3.3 = 25 kg
  // Sisa ke BEP: 1.675 kg
  order({
    id: "ord-101",
    notaNumber: "LBS-20261105-001",
    customerId: "cus-005",
    customerName: "Hotel Palembang Indah",
    customerPhone: "0711-555-0101",
    weightKg: 520,
    status: "diambil",
    notes: "Kontrak linen mingguan",
    createdAt: "2026-11-05T02:00:00.000Z",
    updatedAt: "2026-11-07T08:00:00.000Z",
  }),
  order({
    id: "ord-102",
    notaNumber: "LBS-20261108-002",
    customerId: "cus-006",
    customerName: "Klinik Sehat Sentosa",
    customerPhone: "0711-555-0202",
    weightKg: 380,
    status: "diambil",
    notes: "Seragam & linen klinik",
    createdAt: "2026-11-08T03:00:00.000Z",
    updatedAt: "2026-11-10T09:00:00.000Z",
  }),
  order({
    id: "ord-103",
    notaNumber: "LBS-20261110-003",
    customerId: "cus-005",
    customerName: "Hotel Palembang Indah",
    customerPhone: "0711-555-0101",
    weightKg: 410,
    status: "diambil",
    createdAt: "2026-11-10T02:00:00.000Z",
    updatedAt: "2026-11-12T08:00:00.000Z",
  }),
  order({
    id: "ord-104",
    notaNumber: "LBS-20261112-004",
    customerId: "cus-002",
    customerName: "Budi Santoso",
    customerPhone: "0813-9876-5432",
    weightKg: 95,
    status: "diambil",
    notes: "Kiloan karyawan kontrakan",
    createdAt: "2026-11-12T04:00:00.000Z",
    updatedAt: "2026-11-13T10:00:00.000Z",
  }),
  order({
    id: "ord-105",
    notaNumber: "LBS-20261114-005",
    customerId: "cus-003",
    customerName: "Ayu Lestari",
    customerPhone: "0857-1122-3344",
    weightKg: 120,
    status: "diambil",
    createdAt: "2026-11-14T05:00:00.000Z",
    updatedAt: "2026-11-15T11:00:00.000Z",
  }),
  order({
    id: "ord-106",
    notaNumber: "LBS-20261116-006",
    customerId: "cus-004",
    customerName: "Rizky Pratama",
    customerPhone: "0821-5566-7788",
    weightKg: 90,
    status: "diambil",
    createdAt: "2026-11-16T04:00:00.000Z",
    updatedAt: "2026-11-17T10:00:00.000Z",
  }),
  order({
    id: "ord-107",
    notaNumber: "LBS-20261118-007",
    customerId: "cus-006",
    customerName: "Klinik Sehat Sentosa",
    customerPhone: "0711-555-0202",
    weightKg: 60,
    status: "diambil",
    createdAt: "2026-11-18T03:00:00.000Z",
    updatedAt: "2026-11-19T09:00:00.000Z",
  }),
];

// Verifikasi: 25 + 520+380+410+95+120+90+60 = 1.700 kg
