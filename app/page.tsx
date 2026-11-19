"use client";

import Link from "next/link";
import { OpenTerimaButton } from "@/components/open-terima-button";
import { Button, PageHeader, Panel, PaymentBadge, StatCard, StatusBadge } from "@/components/ui";
import { BEP_KG, BRAND, TARGET_PROFIT_KG } from "@/lib/constants";
import { formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import { useNow } from "@/lib/use-now";

export default function DashboardPage() {
  const { orders, customers, ready } = useLaundry();
  const now = useNow();

  const active = orders.filter((o) => o.status !== "diambil");
  const today = now?.toDateString();
  const todayOrders = today
    ? orders.filter((o) => new Date(o.createdAt).toDateString() === today)
    : [];
  const todayKg = todayOrders.reduce((sum, o) => sum + o.weightKg, 0);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const unpaid = orders.filter((o) => o.paymentStatus !== "lunas");
  const readyPickup = orders.filter((o) => o.status === "selesai");

  return (
    <div>
      <section className="hero-panel mb-8 px-6 py-8 sm:px-10 sm:py-10">
        <div className="hero-blob" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 inline-flex rounded-full border-2 border-ink bg-lilac px-3 py-1 text-xs font-bold text-ink">
            Halo, Kasir!
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            {BRAND.name}
          </h1>
          <p className="mt-3 text-base text-white/90 sm:text-lg">
            {BRAND.tagline} Terima cucian, update status, catat bayar, dan lihat
            laporan — semua dari satu tempat.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <OpenTerimaButton>Terima cucian baru</OpenTerimaButton>
            <Button href="/pesanan" variant="secondary">
              Lihat pesanan aktif
            </Button>
          </div>
        </div>
      </section>

      <PageHeader
        eyebrow="Ringkasan hari ini"
        title="Dashboard operasional"
        description="Informasi operasional laundry"
      />

      {!ready ? (
        <p className="text-ink/60">Memuat data demo…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pesanan aktif"
              value={String(active.length)}
              hint={`${readyPickup.length} siap diambil`}
              accent="teal"
            />
            <StatCard
              label="Volume hari ini"
              value={formatKg(todayKg)}
              hint={`${todayOrders.length} transaksi`}
              accent="yellow"
            />
            <StatCard
              label="Pembayaran masuk hari ini"
              value={formatRupiah(todayRevenue)}
              hint={`${unpaid.length} belum lunas`}
              accent="lilac"
            />
            <StatCard
              label="Pelanggan terdaftar"
              value={String(customers.length)}
              hint="data pelanggan"
              accent="teal"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Antrian aktif</h2>
                <Link
                  href="/pesanan"
                  className="text-sm font-bold text-brand-deep underline-offset-2 hover:underline"
                >
                  Semua pesanan
                </Link>
              </div>
              <div className="space-y-3">
                {active.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/pesanan/${order.id}`}
                    className="flex min-h-[64px] flex-col gap-2 rounded-2xl border-2 border-ink/10 bg-mist/50 px-4 py-3.5 transition hover:border-ink hover:bg-white active:bg-white sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-ink">{order.notaNumber}</p>
                      <p className="text-sm text-ink/65">
                        {order.customerName} · {formatKg(order.weightKg)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={order.status} />
                      <PaymentBadge status={order.paymentStatus} />
                    </div>
                  </Link>
                ))}
                {active.length === 0 ? (
                  <p className="text-sm text-ink/60">Tidak ada antrian aktif.</p>
                ) : null}
              </div>
            </Panel>

            <Panel className="p-5">
              <h2 className="font-display text-xl font-bold">Target usaha</h2>
              <p className="mt-2 text-sm text-ink/65">
                BEP & target laba.
              </p>
              <dl className="mt-5 space-y-4">
                <div className="rounded-2xl border-2 border-ink bg-white px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">
                    Break Even Point
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold">
                    {formatKg(BEP_KG)} / bulan
                  </dd>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-sun px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">
                    Target Laba Rp5jt
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold">
                    {formatKg(TARGET_PROFIT_KG)} / bulan
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
