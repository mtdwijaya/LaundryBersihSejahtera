"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotaReceipt } from "@/components/nota-receipt";
import {
  Button,
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
} from "@/components/ui";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";
import { formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export function OrderDetail({ id }: { id: string }) {
  const { orders, updateStatus, advanceStatus, updatePayment, ready } =
    useLaundry();
  const order = orders.find((item) => item.id === id);
  const [paidInput, setPaidInput] = useState("");
  const [copies, setCopies] = useState<1 | 2>(2);

  useEffect(() => {
    if (!ready || !order) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") !== "1") return;

    const timer = window.setTimeout(() => {
      window.print();
      window.history.replaceState({}, "", `/pesanan/${id}`);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [ready, order?.id, id]);

  if (!order) {
    return (
      <div>
        <PageHeader title="Pesanan tidak ditemukan" />
        <Button href="/pesanan" variant="secondary">
          Kembali ke daftar
        </Button>
      </div>
    );
  }

  const remaining = Math.max(order.total - order.paidAmount, 0);
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const canAdvance = currentIdx < STATUS_FLOW.length - 1;

  function handlePay(amount: number) {
    updatePayment(id, amount);
    setPaidInput("");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="Detail & nota"
          title={order.notaNumber}
          description={`${order.customerName} · ${order.customerPhone}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-bold shadow-hard">
                Salinan
                <select
                  value={copies}
                  onChange={(e) => setCopies(Number(e.target.value) as 1 | 2)}
                  className="rounded-md border border-ink/20 bg-mist px-1 py-0.5"
                >
                  <option value={1}>1 (pelanggan)</option>
                  <option value={2}>2 (pelanggan + toko)</option>
                </select>
              </label>
              <Button variant="primary" onClick={handlePrint}>
                Cetak nota fisik
              </Button>
            </div>
          }
        />
      </div>

      {/* Area khusus print — hanya ini yang keluar di kertas/printer */}
      <div className="nota-print-root">
        <div className="nota-print-stack">
          <NotaReceipt order={order} copyLabel="Salinan pelanggan" />
          {copies === 2 ? (
            <NotaReceipt order={order} copyLabel="Salinan toko" />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] no-print">
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Pratinjau nota</h2>
                <p className="text-sm text-ink/65">
                  Format 80mm siap printer nota / thermal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>

            <div className="nota-preview">
              <NotaReceipt order={order} copyLabel="Pratinjau layar" />
            </div>

            <p className="mt-4 text-sm text-ink/60">
              Tip: di dialog print, pilih printer nota, nonaktifkan header/footer
              browser, dan set lebar kertas ~80mm bila tersedia.
            </p>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h3 className="font-display text-xl font-bold">Update status</h3>
            <p className="mt-1 text-sm text-ink/65">
              Alur: Diterima → Dicuci → Selesai → Diambil
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_FLOW.map((status, index) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateStatus(order.id, status)}
                  className={`rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold ${
                    order.status === status
                      ? "bg-brand text-white"
                      : index <= currentIdx
                        ? "bg-mist"
                        : "bg-white"
                  }`}
                >
                  {STATUS_LABEL[status]}
                </button>
              ))}
            </div>

            <Button
              className="mt-5"
              onClick={() => advanceStatus(order.id)}
              disabled={!canAdvance}
            >
              {canAdvance
                ? `Lanjut ke ${STATUS_LABEL[STATUS_FLOW[currentIdx + 1] as OrderStatus]}`
                : "Sudah diambil"}
            </Button>
          </Panel>
        </div>

        <Panel className="h-fit p-5 sm:p-6">
          <h3 className="font-display text-xl font-bold">Pembayaran</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Berat</span>
              <strong>{formatKg(order.weightKg)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <strong>{formatRupiah(order.total)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Sudah dibayar</span>
              <strong>{formatRupiah(order.paidAmount)}</strong>
            </div>
            <div className="flex justify-between border-t-2 border-ink/10 pt-3">
              <span>Sisa</span>
              <strong>{formatRupiah(remaining)}</strong>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => handlePay(order.total)}>Tandai lunas</Button>
            <Button
              variant="secondary"
              onClick={() => handlePay(0)}
              disabled={order.paidAmount === 0}
            >
              Reset bayar
            </Button>
          </div>

          <div className="mt-5 field">
            <label htmlFor="paid">Bayar sejumlah (Rp)</label>
            <input
              id="paid"
              type="number"
              min="0"
              value={paidInput}
              onChange={(e) => setPaidInput(e.target.value)}
              placeholder={String(remaining || order.total)}
            />
          </div>
          <Button
            className="mt-3 w-full"
            variant="ghost"
            onClick={() => handlePay(Number(paidInput) || 0)}
          >
            Simpan jumlah bayar
          </Button>

          <Button className="mt-4 w-full" variant="secondary" onClick={handlePrint}>
            Cetak nota fisik
          </Button>

          <Link
            href="/pesanan"
            className="mt-6 inline-block text-sm font-bold text-brand-deep hover:underline"
          >
            ← Kembali ke daftar pesanan
          </Link>
        </Panel>
      </div>
    </div>
  );
}
