"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EmptyState,
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
} from "@/components/ui";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export default function PesananPage() {
  const { orders } = useLaundry();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchStatus = status === "all" || order.status === status;
      const matchQuery =
        !q ||
        order.notaNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, query, status]);

  return (
    <div>
      <PageHeader
        eyebrow="Operasional"
        title="Daftar pesanan"
        description="Cari berdasarkan nomor nota, nama, atau nomor HP. Filter status untuk mengejar cucian yang hampir telat."
      />

      <Panel className="mb-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div className="field">
            <label htmlFor="search">Cari</label>
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nota / nama / HP"
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | OrderStatus)
              }
            >
              <option value="all">Semua status</option>
              {STATUS_FLOW.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABEL[item]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan"
          description="Coba ubah kata kunci atau filter status."
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Nota</th>
                  <th>Pelanggan</th>
                  <th>Berat</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Bayar</th>
                  <th>Masuk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/pesanan/${order.id}`}
                        className="font-bold text-brand-deep hover:underline"
                      >
                        {order.notaNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="font-semibold">{order.customerName}</div>
                      <div className="text-sm text-ink/55">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td>{formatKg(order.weightKg)}</td>
                    <td>{formatRupiah(order.total)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="text-sm text-ink/65">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
