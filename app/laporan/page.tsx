"use client";

import { useMemo } from "react";
import { PageHeader, Panel, StatCard } from "@/components/ui";
import {
  BEP_KG,
  FIXED_COST_MONTHLY,
  TARGET_PROFIT_KG,
  VARIABLE_COST_PER_KG,
} from "@/lib/constants";
import { formatDateShort, formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import { useNow } from "@/lib/use-now";

export default function LaporanPage() {
  const { orders } = useLaundry();
  const now = useNow();

  const todayKey = now?.toDateString();
  const month = now?.getMonth();
  const year = now?.getFullYear();

  const daily = useMemo(() => {
    if (!todayKey) return { count: 0, kg: 0, revenue: 0 };
    const list = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === todayKey,
    );
    const kg = list.reduce((sum, o) => sum + o.weightKg, 0);
    const revenue = list.reduce((sum, o) => sum + o.paidAmount, 0);
    return { count: list.length, kg, revenue };
  }, [orders, todayKey]);

  const monthly = useMemo(() => {
    if (month === undefined || year === undefined) {
      return { count: 0, kg: 0, revenue: 0, unpaid: 0 };
    }
    const list = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const kg = list.reduce((sum, o) => sum + o.weightKg, 0);
    const revenue = list.reduce((sum, o) => sum + o.paidAmount, 0);
    const unpaid = list
      .filter((o) => o.paymentStatus !== "lunas")
      .reduce((sum, o) => sum + (o.total - o.paidAmount), 0);
    return { count: list.length, kg, revenue, unpaid };
  }, [orders, month, year]);

  const projectedProfit =
    monthly.kg * (8000 - VARIABLE_COST_PER_KG) - FIXED_COST_MONTHLY;

  const byDay = useMemo(() => {
    const map = new Map<string, { kg: number; revenue: number; count: number }>();
    for (const order of orders) {
      const key = new Date(order.createdAt).toDateString();
      const current = map.get(key) ?? { kg: 0, revenue: 0, count: 0 };
      current.kg += order.weightKg;
      current.revenue += order.paidAmount;
      current.count += 1;
      map.set(key, current);
    }
    return [...map.entries()]
      .map(([key, value]) => ({
        key,
        label: formatDateShort(new Date(key).toISOString()),
        ...value,
      }))
      .sort((a, b) => +new Date(b.key) - +new Date(a.key))
      .slice(0, 7);
  }, [orders]);

  return (
    <div>
      <PageHeader
        eyebrow="Keuangan"
        title="Laporan harian & bulanan"
        description="Laporan otomatis dari transaksi."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Transaksi hari ini"
          value={String(daily.count)}
          hint={formatKg(daily.kg)}
          accent="teal"
        />
        <StatCard
          label="Pembayaran hari ini"
          value={formatRupiah(daily.revenue)}
          accent="yellow"
        />
        <StatCard
          label="Volume bulan ini"
          value={formatKg(monthly.kg)}
          hint={`${monthly.count} transaksi`}
          accent="lilac"
        />
        <StatCard
          label="Pendapatan bulan ini"
          value={formatRupiah(monthly.revenue)}
          hint={`Piutang ${formatRupiah(monthly.unpaid)}`}
          accent="teal"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">7 hari terakhir</h2>
          <div className="mt-4 space-y-3">
            {byDay.map((day) => (
              <div
                key={day.key}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-mist/60 px-4 py-3"
              >
                <div>
                  <p className="font-bold">{day.label}</p>
                  <p className="text-sm text-ink/60">{day.count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRupiah(day.revenue)}</p>
                  <p className="text-sm text-ink/60">{formatKg(day.kg)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Kontrol biaya</h2>
          <p className="mt-2 text-sm text-ink/65">
            Estimasi kasar memakai asumsi kasus: biaya tetap Rp8,5jt/bulan dan
            variabel Rp3.000/kg.
          </p>
          <dl className="mt-5 space-y-3">
            <div className="rounded-2xl border-2 border-ink bg-white px-4 py-3">
              <dt className="text-xs font-bold uppercase text-ink/50">
                Kebutuhan untuk mencapai laba bulan ini
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">
                {formatRupiah(projectedProfit)}
              </dd>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-sun px-4 py-3">
              <dt className="text-xs font-bold uppercase text-ink/50">
                Progress ke BEP
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">
                {formatKg(monthly.kg)} / {formatKg(BEP_KG)}
              </dd>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-lilac px-4 py-3">
              <dt className="text-xs font-bold uppercase text-ink/50">
                Target volume laba Rp5jt
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">
                {formatKg(TARGET_PROFIT_KG)}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
