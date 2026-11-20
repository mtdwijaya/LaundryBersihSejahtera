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
import { formatDate, formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export function OrderDetail({ id }: { id: string }) {
  const {
    orders,
    updateStatus,
    advanceStatus,
    canSetStatus,
    updatePayment,
    ready,
  } = useLaundry();
  const order = orders.find((item) => item.id === id);
  const [paidInput, setPaidInput] = useState("");
  const [statusHint, setStatusHint] = useState("");

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
  const nextStatus =
    currentIdx < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIdx + 1]
      : null;
  const nextBlocked =
    nextStatus != null && !canSetStatus(order.id, nextStatus).ok;
  const canAdvance = Boolean(nextStatus) && !nextBlocked;
  const pickupBlocked = order.paymentStatus !== "lunas";

  function handlePay(amount: number) {
    updatePayment(id, amount);
    setPaidInput("");
    setStatusHint("");
  }

  function handleStatus(status: OrderStatus) {
    const result = updateStatus(id, status);
    if (!result.ok && result.reason === "unpaid_pickup") {
      setStatusHint("Status Diambil hanya boleh jika pembayaran sudah lunas.");
      return;
    }
    setStatusHint("");
  }

  function handleAdvance() {
    const result = advanceStatus(id);
    if (!result.ok && result.reason === "unpaid_pickup") {
      setStatusHint("Lunasi pembayaran dulu sebelum menandai Diambil.");
      return;
    }
    setStatusHint("");
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="Detail & nota"
          title={order.notaNumber}
          description={`${order.customerName} · ${order.customerPhone}`}
          action={
            <Button
              variant="secondary"
              onClick={() => window.print()}
            >
              Cetak nota
            </Button>
          }
        />
      </div>

      {/* Hanya muncul saat print */}
      <div className="nota-print-root">
        <div className="nota-print-stack">
          <NotaReceipt order={order} copyLabel="Salinan pelanggan" />
          <NotaReceipt order={order} copyLabel="Salinan toko" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr] no-print">
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink/10 pb-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-ink/50">
                  Laundry Bersih Sejahtera
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold">
                  Nota Cucian
                </h2>
              </div>
              <div className="text-right text-sm text-ink/65">
                <p>{formatDate(order.createdAt)}</p>
                <p className="font-bold text-ink">{order.notaNumber}</p>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase text-ink/45">
                  Pelanggan
                </dt>
                <dd className="mt-1 font-semibold">{order.customerName}</dd>
                <dd className="text-sm text-ink/65">{order.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-ink/45">
                  Ringkasan
                </dt>
                <dd className="mt-1 font-semibold">
                  {formatKg(order.weightKg)} × {formatRupiah(order.pricePerKg)}
                </dd>
                <dd className="text-sm text-ink/65">
                  Total {formatRupiah(order.total)}
                </dd>
              </div>
            </dl>

            {order.notes ? (
              <p className="mt-5 rounded-2xl bg-mist px-4 py-3 text-sm">
                <strong>Catatan:</strong> {order.notes}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h3 className="font-display text-xl font-bold">Update status</h3>
            <p className="mt-1 text-sm text-ink/65">
              Alur: Diterima → Dicuci → Selesai → Diambil
            </p>
            <p className="mt-2 rounded-2xl border-2 border-ink/10 bg-mist px-3 py-2 text-sm text-ink/70">
              Batasan: <strong>Diambil</strong> hanya jika pembayaran{" "}
              <strong>Lunas</strong>.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_FLOW.map((status, index) => {
                const blocked =
                  status === "diambil" &&
                  pickupBlocked &&
                  order.status !== "diambil";
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatus(status)}
                    disabled={blocked}
                    title={
                      blocked
                        ? "Lunasi pembayaran dulu sebelum Diambil"
                        : undefined
                    }
                    className={`rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45 ${
                      order.status === status
                        ? "bg-brand text-white"
                        : index <= currentIdx
                          ? "bg-mist"
                          : "bg-white"
                    }`}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                );
              })}
            </div>

            {statusHint || nextBlocked ? (
              <p className="mt-3 rounded-2xl border-2 border-ink bg-rose/70 px-3 py-2 text-sm font-semibold text-ink">
                {statusHint ||
                  "Lunasi pembayaran dulu sebelum menandai Diambil."}
              </p>
            ) : null}

            <Button
              className="mt-5"
              onClick={handleAdvance}
              disabled={!canAdvance}
            >
              {!nextStatus
                ? "Sudah diambil"
                : nextBlocked
                  ? "Lunas dulu untuk Diambil"
                  : `Lanjut ke ${STATUS_LABEL[nextStatus]}`}
            </Button>
          </Panel>
        </div>

        <Panel className="h-fit p-5 sm:p-6">
          <h3 className="font-display text-xl font-bold">Pembayaran</h3>
          <div className="mt-4 space-y-3 text-sm">
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
