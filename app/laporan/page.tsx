"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Panel } from "@/components/ui";
import {
  BEP_KG,
  CM_PER_KG,
  FIXED_COST_MONTHLY,
  TARGET_PROFIT_KG,
  TARGET_PROFIT_RUPIAH,
  VARIABLE_COST_PER_KG,
} from "@/lib/constants";
import { formatDateShort, formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import type { Order } from "@/lib/types";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function daysBetween(from: Date, to: Date) {
  const a = startOfDay(from);
  const b = startOfDay(to);
  return Math.max(1, Math.round((+b - +a) / 86_400_000) + 1);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(100, value);
}

function toInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseInputDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateRange(customFrom: string, customTo: string) {
  const from = startOfDay(parseInputDate(customFrom));
  const to = endOfDay(parseInputDate(customTo));
  return from <= to ? { from, to } : { from: to, to: from };
}

function inRange(iso: string, from: Date, to: Date) {
  const time = +new Date(iso);
  return time >= +from && time <= +to;
}

function unpaidAgeDays(order: Order, now: Date) {
  return Math.max(0, daysBetween(new Date(order.createdAt), now) - 1);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ProgressTrack({
  label,
  valueLabel,
  percent,
  badge,
  tone,
}: {
  label: string;
  valueLabel: string;
  percent: number;
  badge?: string;
  tone: "green" | "lilac";
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
          {label}
        </p>
        {badge ? (
          <span className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-bold text-ink/70">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full ${
            tone === "green" ? "bg-emerald-500" : "bg-lilac"
          }`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-ink/60">{valueLabel}</p>
    </div>
  );
}

export default function LaporanPage() {
  const { orders } = useLaundry();
  const now = useNow();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const report = useMemo(() => {
    if (!now) return null;

    const fromDefault = toInputDate(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
    const toDefault = toInputDate(now);
    const range = dateRange(
      customFrom || fromDefault,
      customTo || toDefault,
    );

    const periodOrders = orders.filter((o) =>
      inRange(o.createdAt, range.from, range.to),
    );

    const billed = periodOrders.reduce((sum, o) => sum + o.total, 0);
    const received = periodOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const kg = periodOrders.reduce((sum, o) => sum + o.weightKg, 0);
    const dayCount = daysBetween(range.from, range.to);
    const avgPerDay = kg / dayCount;

    const unpaidOrders = periodOrders
      .filter((o) => o.paymentStatus !== "lunas")
      .map((o) => ({
        order: o,
        remaining: Math.max(o.total - o.paidAmount, 0),
        age: unpaidAgeDays(o, now),
      }))
      .sort((a, b) => b.age - a.age || b.remaining - a.remaining);

    const piutang = unpaidOrders.reduce((sum, item) => sum + item.remaining, 0);
    const oldestAge = unpaidOrders[0]?.age ?? 0;

    const coversFullMonth =
      range.from.getDate() === 1 &&
      range.from.getMonth() === range.to.getMonth() &&
      range.from.getFullYear() === range.to.getFullYear() &&
      range.to.getDate() >=
        new Date(range.to.getFullYear(), range.to.getMonth() + 1, 0).getDate();
    const fixedCost = coversFullMonth
      ? FIXED_COST_MONTHLY
      : Math.round((FIXED_COST_MONTHLY * dayCount) / 30);
    const variableCost = Math.round(kg * VARIABLE_COST_PER_KG);
    const profit = Math.round(kg * CM_PER_KG) - fixedCost;

    const bepPercent = (kg / BEP_KG) * 100;
    const targetPercent = (kg / TARGET_PROFIT_KG) * 100;
    const remainingToTarget = Math.max(TARGET_PROFIT_KG - kg, 0);

    const last7From = startOfDay(now);
    last7From.setDate(last7From.getDate() - 6);
    const last7To = endOfDay(now);

    const byDayMap = new Map<
      string,
      { count: number; kg: number; billed: number; paid: number }
    >();

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(last7From);
      day.setDate(last7From.getDate() + i);
      byDayMap.set(day.toDateString(), {
        count: 0,
        kg: 0,
        billed: 0,
        paid: 0,
      });
    }

    for (const order of orders) {
      if (!inRange(order.createdAt, last7From, last7To)) continue;
      const key = new Date(order.createdAt).toDateString();
      const bucket = byDayMap.get(key);
      if (!bucket) continue;
      bucket.count += 1;
      bucket.kg += order.weightKg;
      bucket.billed += order.total;
      bucket.paid += order.paidAmount;
    }

    const last7 = [...byDayMap.entries()]
      .map(([key, value]) => {
        const remaining = Math.max(value.billed - value.paid, 0);
        const status =
          value.count === 0
            ? "Tidak ada"
            : remaining > 0
              ? "Belum lunas"
              : "Lunas";
        return {
          key,
          label: formatDateShort(new Date(key).toISOString()),
          ...value,
          remaining,
          status,
        };
      })
      .sort((a, b) => +new Date(b.key) - +new Date(a.key));

    const last7Total = last7.reduce(
      (acc, day) => ({
        count: acc.count + day.count,
        kg: acc.kg + day.kg,
        billed: acc.billed + day.billed,
        paid: acc.paid + day.paid,
        remaining: acc.remaining + day.remaining,
      }),
      { count: 0, kg: 0, billed: 0, paid: 0, remaining: 0 },
    );

    const rangeLabel = `${range.from.getDate()} – ${range.to.getDate()} ${new Intl.DateTimeFormat(
      "id-ID",
      { month: "long", year: "numeric" },
    ).format(range.to)}`;

    return {
      range,
      rangeLabel,
      fromDefault,
      toDefault,
      periodOrders,
      billed,
      received,
      kg,
      dayCount,
      avgPerDay,
      unpaidOrders,
      piutang,
      oldestAge,
      fixedCost,
      variableCost,
      profit,
      bepPercent,
      targetPercent,
      remainingToTarget,
      last7,
      last7Total,
      dayCountLabel: dayCount,
    };
  }, [orders, now, customFrom, customTo]);

  function handleExportExcel() {
    if (!report) return;
    const rows = [
      ["Tanggal", "Transaksi", "Berat (kg)", "Tagihan", "Dibayar", "Sisa", "Status"],
      ...report.last7.map((day) => [
        day.label,
        String(day.count),
        String(day.kg),
        String(day.billed),
        String(day.paid),
        String(day.remaining),
        day.status,
      ]),
      [
        "Total 7 hari",
        String(report.last7Total.count),
        String(report.last7Total.kg),
        String(report.last7Total.billed),
        String(report.last7Total.paid),
        String(report.last7Total.remaining),
        "",
      ],
    ];
    downloadCsv(`laporan-laundry-${toInputDate(new Date())}.csv`, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Laporan
          </h1>
          <p className="mt-2 text-ink/65">
            {report ? (
              <>
                {report.rangeLabel} · diperbarui hari ini
              </>
            ) : (
              "Memuat periode…"
            )}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPickerOpen((open) => !open);
                if (now) {
                  setCustomFrom(
                    customFrom ||
                      toInputDate(
                        new Date(now.getFullYear(), now.getMonth(), 1),
                      ),
                  );
                  setCustomTo(customTo || toInputDate(now));
                }
              }}
              className={`rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold shadow-hard ${
                pickerOpen ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              Pilih tanggal
            </button>
            <Button
              variant="ghost"
              className="!min-h-0 !px-3 !py-1.5 !text-xs"
              onClick={() => window.print()}
            >
              Ekspor PDF
            </Button>
            <Button
              variant="secondary"
              className="!min-h-0 !px-3 !py-1.5 !text-xs"
              onClick={handleExportExcel}
            >
              Ekspor Excel
            </Button>
          </div>

          {pickerOpen ? (
            <div className="flex flex-wrap items-end gap-2 rounded-2xl border-2 border-ink bg-white p-3 shadow-hard">
              <div className="field min-w-[9.5rem] flex-1">
                <label htmlFor="from" className="!text-xs">
                  Dari
                </label>
                <input
                  id="from"
                  type="date"
                  className="!min-h-10 !py-2 !text-sm"
                  value={customFrom || report?.fromDefault || ""}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="field min-w-[9.5rem] flex-1">
                <label htmlFor="to" className="!text-xs">
                  Sampai
                </label>
                <input
                  id="to"
                  type="date"
                  className="!min-h-10 !py-2 !text-sm"
                  value={customTo || report?.toDefault || ""}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!report ? (
        <p className="text-ink/60">Memuat laporan…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard">
              <p className="text-sm font-medium text-ink/60">Kas diterima</p>
              <p className="mt-2 font-display text-3xl font-bold">
                {formatRupiah(report.received)}
              </p>
              <p className="mt-2 text-sm text-ink/55">
                dari total tagihan {formatRupiah(report.billed)}
              </p>
            </div>

            <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard">
              <p className="text-sm font-medium text-ink/60">Piutang</p>
              <p className="mt-2 font-display text-3xl font-bold">
                {formatRupiah(report.piutang)}
              </p>
              <p className="mt-2 text-sm text-ink/55">
                {report.unpaidOrders.length} transaksi belum lunas
                {report.unpaidOrders.length > 0
                  ? ` · tertua ${report.oldestAge} hari`
                  : ""}
              </p>
            </div>

            <div className="rounded-3xl border-2 border-ink bg-lilac/50 p-5 shadow-hard">
              <p className="text-sm font-medium text-ink/60">Volume periode</p>
              <p className="mt-2 font-display text-3xl font-bold">
                {formatKg(report.kg)}
              </p>
              <p className="mt-2 text-sm text-ink/55">
                {report.periodOrders.length} transaksi · rata-rata{" "}
                {formatKg(Number(report.avgPerDay.toFixed(1)))} / hari
              </p>
            </div>

            <div className="rounded-3xl border-2 border-ink bg-sun/70 p-5 shadow-hard">
              <p className="text-sm font-medium text-ink/60">Laba periode</p>
              <p className="mt-2 font-display text-3xl font-bold">
                {formatRupiah(report.profit)}
              </p>
              <p className="mt-2 text-sm text-ink/55">
                {report.kg >= BEP_KG
                  ? report.kg === BEP_KG
                    ? "Tepat di titik impas (BEP)"
                    : "Di atas titik impas (BEP)"
                  : "Masih di bawah BEP"}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">Kontrol biaya</h2>

              <div className="mt-5 space-y-5">
                <ProgressTrack
                  label="Progress ke BEP"
                  badge={
                    report.kg >= BEP_KG
                      ? report.kg === BEP_KG
                        ? "Tepat di BEP"
                        : "Di atas BEP"
                      : "Di bawah BEP"
                  }
                  valueLabel={`${formatKg(report.kg)} dari ${formatKg(BEP_KG)}`}
                  percent={report.bepPercent}
                  tone="green"
                />
                <ProgressTrack
                  label={`Target laba ${formatRupiah(TARGET_PROFIT_RUPIAH)}`}
                  valueLabel={`${formatKg(report.kg)} dari ${formatKg(TARGET_PROFIT_KG)} · sisa ${formatKg(report.remainingToTarget)}`}
                  percent={report.targetPercent}
                  tone="lilac"
                />
              </div>

              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3">
                  <dt>Total tagihan</dt>
                  <dd className="font-bold">{formatRupiah(report.billed)}</dd>
                </div>
                <div className="flex justify-between gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3">
                  <dt>Biaya variabel</dt>
                  <dd className="font-bold">
                    - {formatRupiah(report.variableCost)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 rounded-2xl border-2 border-ink/10 px-4 py-3">
                  <dt>Biaya tetap</dt>
                  <dd className="font-bold">
                    - {formatRupiah(report.fixedCost)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 rounded-2xl border-2 border-ink bg-sun px-4 py-3">
                  <dt className="font-bold">Laba</dt>
                  <dd className="font-display text-lg font-bold">
                    {formatRupiah(report.profit)}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Piutang</h2>
                <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-bold">
                  {formatRupiah(report.piutang)}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {report.unpaidOrders.length === 0 ? (
                  <p className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/55">
                    Tidak ada piutang pada periode ini.
                  </p>
                ) : (
                  report.unpaidOrders.slice(0, 6).map((item) => (
                    <Link
                      key={item.order.id}
                      href={`/pesanan/${item.order.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-mist/50 px-4 py-3 transition hover:border-ink hover:bg-white"
                    >
                      <div>
                        <p className="font-bold">{item.order.customerName}</p>
                        <p className="text-sm text-ink/60">
                          {formatDateShort(item.order.createdAt)} ·{" "}
                          {formatKg(item.order.weightKg)} ·{" "}
                          {item.order.notaNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatRupiah(item.remaining)}
                        </p>
                        <span
                          className={`badge ${
                            item.age >= 2 ? "badge-rose" : "badge-yellow"
                          }`}
                        >
                          {item.age} hari
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
                <p className="text-sm font-bold">
                  Total piutang: {formatRupiah(report.piutang)}
                </p>
                <Button href="/pesanan?filter=piutang" variant="primary">
                  Lihat semua piutang
                </Button>
              </div>
            </Panel>
          </div>

          <Panel className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 px-5 py-4">
              <h2 className="font-display text-xl font-bold">
                Rincian 7 hari terakhir
              </h2>
              <span className="rounded-full border border-ink/15 bg-lilac/50 px-3 py-1 text-xs font-bold text-ink/70">
                Tagihan dan dibayar dipisah
              </span>
            </div>

            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Transaksi</th>
                    <th>Berat</th>
                    <th>Tagihan</th>
                    <th>Dibayar</th>
                    <th>Sisa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.last7.map((day) => (
                    <tr key={day.key}>
                      <td className="font-semibold">{day.label}</td>
                      <td>{day.count}</td>
                      <td>{formatKg(day.kg)}</td>
                      <td>{formatRupiah(day.billed)}</td>
                      <td>{formatRupiah(day.paid)}</td>
                      <td>{formatRupiah(day.remaining)}</td>
                      <td>
                        <span
                          className={`badge ${
                            day.status === "Lunas"
                              ? "badge-teal"
                              : day.status === "Belum lunas"
                                ? "badge-yellow"
                                : "badge-ink"
                          }`}
                        >
                          {day.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-sun/60">
                    <td className="font-bold">Total 7 hari</td>
                    <td className="font-bold">{report.last7Total.count}</td>
                    <td className="font-bold">
                      {formatKg(report.last7Total.kg)}
                    </td>
                    <td className="font-bold">
                      {formatRupiah(report.last7Total.billed)}
                    </td>
                    <td className="font-bold">
                      {formatRupiah(report.last7Total.paid)}
                    </td>
                    <td className="font-bold">
                      {formatRupiah(report.last7Total.remaining)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
