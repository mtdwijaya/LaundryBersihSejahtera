"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, PageHeader, Panel } from "@/components/ui";
import { formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";

export default function PelangganPage() {
  const { customers, orders, addCustomer } = useLaundry();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter(
        (customer) =>
          !q ||
          customer.name.toLowerCase().includes(q) ||
          customer.phone.toLowerCase().includes(q),
      )
      .map((customer) => {
        const related = orders.filter((o) => o.customerId === customer.id);
        const totalKg = related.reduce((sum, o) => sum + o.weightKg, 0);
        const totalSpend = related.reduce((sum, o) => sum + o.paidAmount, 0);
        return { customer, count: related.length, totalKg, totalSpend };
      });
  }, [customers, orders, query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setName("");
    setPhone("");
    setAddress("");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Master data"
        title="Pelanggan"
        description="Simpan data pelanggan supaya kasir tidak mengetik ulang tiap transaksi."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <Panel className="h-fit p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Tambah pelanggan</h2>
          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            <div className="field">
              <label htmlFor="name">Nama</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">No. HP</label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="address">Alamat</label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button type="submit">Simpan pelanggan</Button>
          </form>
        </Panel>

        <div>
          <Panel className="mb-4 p-4">
            <div className="field">
              <label htmlFor="search">Cari pelanggan</label>
              <input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nama atau HP"
              />
            </div>
          </Panel>

          {rows.length === 0 ? (
            <EmptyState
              title="Belum ada pelanggan"
              description="Tambahkan pelanggan baru di formulir sebelah kiri."
            />
          ) : (
            <div className="space-y-3">
              {rows.map(({ customer, count, totalKg, totalSpend }) => (
                <Panel key={customer.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-ink/65">
                        {customer.phone}
                        {customer.address ? ` · ${customer.address}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="badge badge-teal">{count} transaksi</span>
                      <span className="badge badge-yellow">
                        {formatKg(totalKg)}
                      </span>
                      <span className="badge badge-lilac">
                        {formatRupiah(totalSpend)}
                      </span>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
