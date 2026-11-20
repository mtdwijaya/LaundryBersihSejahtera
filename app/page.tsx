"use client";

import Link from "next/link";
import { useMemo } from "react";
import { OpenTerimaButton } from "@/components/open-terima-button";
import { Button, Panel } from "@/components/ui";
import {
  BEP_KG,
  BEP_RUPIAH,
  CM_PER_KG,
  FIXED_COST_MONTHLY,
  INVESTMENT,
  PRICE_PER_KG,
  STATUS_FLOW,
  STATUS_LABEL,
  TARGET_PROFIT_KG,
  TARGET_PROFIT_RUPIAH,
  TARGET_REVENUE_RUPIAH,
} from "@/lib/constants";
import { formatDate, formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { Order } from "@/lib/types";

function clampPercent(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, 100);
}

function daysBetween(fromIso: string, to: Date) {
  const from = new Date(fromIso);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((+end - +start) / 86_400_000);
}

function promisedFinishLabel(createdAt: string, now: Date) {
  const created = new Date(createdAt);
  const due = new Date(created);
  due.setDate(due.getDate() + 1);
  due.setHours(16, 0, 0, 0);

  const sameDay =
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate();

  if (sameDay) return "Hari ini, 16.00";
  return formatDate(due.toISOString());
}

type ChaseItem = {
  order: Order;
  label: string;
  tone: "yellow" | "rose" | "teal";
  promise: string;
};

function buildChaseList(orders: Order[], now: Date): ChaseItem[] {
  const items: ChaseItem[] = [];

  for (const order of orders) {
    const promise = promisedFinishLabel(order.createdAt, now);

    if (order.status === "selesai") {
      items.push({
        order,
        label: "Selesai, belum diambil",
        tone: "teal",
        promise,
      });
      continue;
    }

    if (order.status === "diterima" || order.status === "dicuci") {
      const ageDays = daysBetween(order.createdAt, now);
      if (ageDays >= 1) {
        items.push({
          order,
          label: `Telat ${ageDays} hari`,
          tone: "rose",
          promise,
        });
      } else {
        const ageHours = (+now - +new Date(order.createdAt)) / 3_600_000;
        if (ageHours >= 8) {
          items.push({
            order,
            label: "Hampir telat",
            tone: "yellow",
            promise,
          });
        }
      }
    }
  }

  const rank = { rose: 0, yellow: 1, teal: 2 } as const;
  return items.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 8);
}

function ProgressBar({
  percent,
  tone = "teal",
}: {
  percent: number;
  tone?: "teal" | "yellow" | "lilac" | "green";
}) {
  const color = {
    teal: "bg-brand",
    yellow: "bg-sun",
    lilac: "bg-lilac",
    green: "bg-emerald-500",
  }[tone];

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${clampPercent(percent)}%` }}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  percent,
  tone = "teal",
  highlight = false,
  badge,
}: {
  label: string;
  value: string;
  hint: string;
  percent?: number;
  tone?: "teal" | "yellow" | "lilac" | "green";
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`rounded-3xl border-2 border-ink p-5 shadow-hard ${
        highlight ? "bg-[#dff7e8]" : "bg-white"
      }`}
    >
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
      {badge ? (
        <span className="mt-2 inline-flex rounded-full border border-ink/20 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700">
          {badge}
        </span>
      ) : null}
      {percent != null ? <ProgressBar percent={percent} tone={tone} /> : null}
      <p className="mt-2 text-sm text-ink/55">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { orders, ready } = useLaundry();
  const now = useNow();


  const stats = useMemo(() => {
    if (!now) {
      return null;
    }

    const month = now.getMonth();
    const year = now.getFullYear();
    const todayKey = now.toDateString();

    const monthlyOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const monthlyKg = monthlyOrders.reduce((sum, o) => sum + o.weightKg, 0);
    const monthlyRevenue = monthlyOrders.reduce(
      (sum, o) => sum + o.paidAmount,
      0,
    );
    const monthlyProfit = monthlyKg * CM_PER_KG - FIXED_COST_MONTHLY;
    const gapToBep = monthlyKg - BEP_KG;
    const volumeProgress = (monthlyKg / TARGET_PROFIT_KG) * 100;
    const revenueProgress = (monthlyRevenue / TARGET_REVENUE_RUPIAH) * 100;
    const profitProgress = (monthlyProfit / TARGET_PROFIT_RUPIAH) * 100;
    const bepSafety =
      monthlyKg > 0 ? (gapToBep / Math.max(monthlyKg, 1)) * 100 : 0;

    const statusToday = Object.fromEntries(
      STATUS_FLOW.map((status) => [
        status,
        orders.filter((o) => {
          if (o.status !== status) return false;
          if (status === "diambil") {
            return new Date(o.updatedAt).toDateString() === todayKey;
          }
          return true;
        }).length,
      ]),
    ) as Record<(typeof STATUS_FLOW)[number], number>;

    const chase = buildChaseList(orders, now);

    const paidToday = orders
      .filter((o) => new Date(o.updatedAt).toDateString() === todayKey)
      .reduce((sum, o) => sum + o.paidAmount, 0);

    const unpaid = orders.filter(
      (o) => o.status !== "diambil" && o.paymentStatus !== "lunas",
    );
    const selesaiUnpaid = orders.filter(
      (o) => o.status === "selesai" && o.paymentStatus !== "lunas",
    );
    const mismatchTotal = orders.filter(
      (o) => Math.round(o.weightKg * o.pricePerKg) !== o.total,
    );
    // Prototype: tidak ada jejak audit dobel bayar → tetap tampilkan 0
    const doublePay = 0;
    const needCheck = mismatchTotal.length + doublePay;

    const cumulative = INVESTMENT.yearlyNetCashflow.reduce<number[]>(
      (acc, value) => {
        const prev = acc[acc.length - 1] ?? 0;
        acc.push(prev + value);
        return acc;
      },
      [],
    );

    return {
      monthlyKg,
      monthlyRevenue,
      monthlyProfit,
      gapToBep,
      volumeProgress,
      revenueProgress,
      profitProgress,
      bepSafety,
      statusToday,
      chase,
      paidToday,
      unpaid,
      selesaiUnpaid,
      mismatchTotal,
      doublePay,
      needCheck,
      cumulative,
    };
  }, [orders, now]);

  const maxCash = Math.max(
    INVESTMENT.initial,
    ...(stats?.cumulative ?? [0]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-ink/65">
            Ringkasan kinerja bulan berjalan, antrian yang perlu dikejar, dan
            kontrol pembayaran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OpenTerimaButton />
          <Button href="/laporan" variant="secondary">
            Laporan
          </Button>
        </div>
      </div>

      {!ready || !stats ? (
        <p className="text-ink/60">Memuat data…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Volume cucian bulan ini"
              value={formatKg(stats.monthlyKg)}
              hint={`${Math.round(clampPercent(stats.volumeProgress))}% dari target ${formatKg(TARGET_PROFIT_KG)}`}
              percent={stats.volumeProgress}
              tone="teal"
            />
            <MetricCard
              label="Pendapatan bulan ini"
              value={formatRupiah(stats.monthlyRevenue)}
              hint={`${formatKg(stats.monthlyKg)} × ${formatRupiah(PRICE_PER_KG)} · target ${formatRupiah(TARGET_REVENUE_RUPIAH)}`}
              percent={stats.revenueProgress}
              tone="yellow"
            />
            <MetricCard
              label="Laba bulan ini"
              value={formatRupiah(stats.monthlyProfit)}
              hint={`${Math.round(clampPercent(stats.profitProgress))}% dari target ${formatRupiah(TARGET_PROFIT_RUPIAH)}`}
              percent={stats.profitProgress}
              tone="lilac"
            />
            <MetricCard
              label="Jarak ke titik impas (BEP)"
              value={`${stats.gapToBep >= 0 ? "+" : ""}${formatKg(stats.gapToBep)}`}
              hint={`BEP ${formatKg(BEP_KG)} atau ${formatRupiah(BEP_RUPIAH)}`}
              percent={stats.gapToBep >= 0 ? 100 : clampPercent((stats.monthlyKg / BEP_KG) * 100)}
              tone="green"
              highlight
              badge={
                stats.gapToBep >= 0
                  ? `Aman · ${Math.max(0, Math.round(stats.bepSafety))}% di atas BEP`
                  : "Masih di bawah BEP"
              }
            />
          </div>

          <Panel className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">
              Status cucian hari ini
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATUS_FLOW.map((status) => (
                <div
                  key={status}
                  className="rounded-2xl border-2 border-ink/10 bg-mist/70 px-4 py-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
                    {STATUS_LABEL[status]}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold">
                    {stats.statusToday[status]}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="font-display text-lg font-bold">Perlu dikejar</h3>
              {stats.chase.length === 0 ? (
                <p className="mt-3 rounded-2xl border-2 border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/55">
                  Tidak ada cucian yang perlu dikejar saat ini.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-2xl border-2 border-ink/10">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>No. Nota</th>
                        <th>Pelanggan</th>
                        <th>Berat</th>
                        <th>Janji selesai</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.chase.map((item) => (
                        <tr key={item.order.id}>
                          <td>
                            <Link
                              href={`/pesanan/${item.order.id}`}
                              className="font-bold text-brand-deep hover:underline"
                            >
                              {item.order.notaNumber}
                            </Link>
                          </td>
                          <td>{item.order.customerName}</td>
                          <td>{formatKg(item.order.weightKg)}</td>
                          <td className="text-sm text-ink/65">{item.promise}</td>
                          <td>
                            <span
                              className={`badge ${
                                item.tone === "rose"
                                  ? "badge-rose"
                                  : item.tone === "yellow"
                                    ? "badge-yellow"
                                    : "badge-teal"
                              }`}
                            >
                              {item.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">Pembayaran</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-ink/10 bg-mist px-3 py-3">
                  <p className="text-xs font-bold uppercase text-ink/50">
                    Uang masuk hari ini
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {formatRupiah(stats.paidToday)}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-sun/70 px-3 py-3">
                  <p className="text-xs font-bold uppercase text-ink/50">
                    Belum lunas
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {stats.unpaid.length} nota
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-rose/70 px-3 py-3">
                  <p className="text-xs font-bold uppercase text-ink/50">
                    Perlu dicek
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {stats.needCheck} transaksi
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3">
                  <span>Cucian selesai tapi belum dibayar</span>
                  <strong>{stats.selesaiUnpaid.length} nota</strong>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3">
                  <span>Pembayaran tercatat dobel</span>
                  <strong>{stats.doublePay} nota</strong>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3">
                  <span>Nominal tidak sesuai berat × tarif</span>
                  <strong>{stats.mismatchTotal.length} nota</strong>
                </li>
              </ul>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">
                Balik modal sistem
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Angka dari analisis kelayakan kasus (tetap).
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-ink/10 bg-mist px-3 py-3">
                  <p className="text-xs font-bold uppercase text-ink/50">
                    Payback
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {INVESTMENT.paybackYears.toString().replace(".", ",")} tahun
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink/10 bg-mist px-3 py-3">
                  <p className="text-xs font-bold uppercase text-ink/50">NPV</p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {formatRupiah(INVESTMENT.npv)}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink/10 bg-mist px-3 py-3">
                  <p className="text-xs font-bold uppercase text-ink/50">
                    ROI 3 tahun
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {INVESTMENT.roiPercent}%
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-ink/70">
                  Arus kas bersih kumulatif vs investasi{" "}
                  {formatRupiah(INVESTMENT.initial)}
                </p>
                <div className="relative mt-4 space-y-3">
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 border-l-2 border-dashed border-ink/40"
                    style={{
                      left: `${(INVESTMENT.initial / maxCash) * 100}%`,
                    }}
                    title="Titik investasi"
                  />
                  {stats.cumulative.map((value, index) => (
                    <div key={index} className="grid grid-cols-[52px_1fr] gap-3 items-center">
                      <span className="text-sm font-bold text-ink/60">
                        Thn {index + 1}
                      </span>
                      <div className="rounded-full bg-ink/10 p-1">
                        <div
                          className="rounded-full bg-brand px-3 py-2 text-xs font-bold text-white"
                          style={{
                            width: `${Math.max((value / maxCash) * 100, 8)}%`,
                          }}
                        >
                          {formatRupiah(value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
