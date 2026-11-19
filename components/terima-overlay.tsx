"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { PRICE_PER_KG } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

export function TerimaOverlay() {
  const router = useRouter();
  const { customers, addOrder } = useLaundry();
  const { terimaOpen, closeTerima } = useUi();
  const titleId = useId();
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [weightKg, setWeightKg] = useState("3");
  const [notes, setNotes] = useState("");
  const [autoPrint, setAutoPrint] = useState(true);

  const selected = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const weight = Number(weightKg) || 0;
  const total = Math.round(weight * PRICE_PER_KG);

  useEffect(() => {
    if (!terimaOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeTerima();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [terimaOpen, closeTerima]);

  function resetForm() {
    setCustomerId("");
    setName("");
    setPhone("");
    setAddress("");
    setWeightKg("3");
    setNotes("");
    setAutoPrint(true);
  }

  function onSelectCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((c) => c.id === id);
    if (!customer) {
      setName("");
      setPhone("");
      setAddress("");
      return;
    }
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || weight <= 0) return;

    const order = addOrder({
      customerId: customerId || undefined,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      weightKg: weight,
      notes: notes.trim(),
    });

    resetForm();
    closeTerima();
    router.push(
      autoPrint ? `/pesanan/${order.id}?print=1` : `/pesanan/${order.id}`,
    );
  }

  if (!terimaOpen) return null;

  return (
    <div className="overlay-root" role="presentation">
      <button
        type="button"
        className="overlay-backdrop"
        aria-label="Tutup form terima cucian"
        onClick={closeTerima}
      />

      <div
        className="overlay-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="overlay-handle" aria-hidden="true" />

        <div className="overlay-header">
          <div>
            <p className="eyebrow mb-2">Kasir</p>
            <h2 id={titleId} className="font-display text-2xl font-bold text-ink md:text-3xl">
              Terima cucian
            </h2>
            <p className="mt-1 text-sm text-ink/65 md:text-base">
              Isi sekali, sistem buat nomor nota unik otomatis.
            </p>
          </div>
          <button
            type="button"
            className="touch-target rounded-full border-2 border-ink bg-white px-4 font-bold shadow-hard"
            onClick={closeTerima}
          >
            Tutup
          </button>
        </div>

        <form onSubmit={onSubmit} className="overlay-body">
          <div className="grid gap-5 md:grid-cols-[1.35fr_0.9fr]">
            <div className="space-y-4">
              <div className="field">
                <label htmlFor="overlay-customer">Pelanggan tersimpan</label>
                <select
                  id="overlay-customer"
                  ref={firstFieldRef}
                  value={customerId}
                  onChange={(e) => onSelectCustomer(e.target.value)}
                >
                  <option value="">Pelanggan baru</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} · {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="overlay-name">Nama</label>
                  <input
                    id="overlay-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama pelanggan"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="overlay-phone">No. HP</label>
                  <input
                    id="overlay-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xx-xxxx-xxxx"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="overlay-address">Alamat (opsional)</label>
                <input
                  id="overlay-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat singkat"
                  disabled={Boolean(selected)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="overlay-weight">Berat (kg)</label>
                  <input
                    id="overlay-weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label htmlFor="overlay-tarif">Tarif</label>
                  <input
                    id="overlay-tarif"
                    value={`${formatRupiah(PRICE_PER_KG)} / kg`}
                    disabled
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="overlay-notes">Catatan</label>
                <textarea
                  id="overlay-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: pisahkan baju putih, ada jaket"
                />
              </div>
            </div>

            <aside className="overlay-summary">
              <p className="eyebrow">Ringkasan nota</p>
              <p className="mt-3 font-display text-3xl font-bold text-ink">
                {formatRupiah(total)}
              </p>
              <p className="mt-1 text-sm text-ink/65">
                {weight || 0} kg × {formatRupiah(PRICE_PER_KG)}
              </p>

              <ul className="mt-5 space-y-2 text-sm text-ink/75">
                <li className="rounded-2xl border-2 border-ink/10 bg-mist px-4 py-3">
                  Status awal: <strong>Diterima</strong>
                </li>
                <li className="rounded-2xl border-2 border-ink/10 bg-mist px-4 py-3">
                  Nota fisik siap dicetak
                </li>
              </ul>

              <label className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-ink bg-sun/50 px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="h-5 w-5 accent-brand"
                />
                Cetak nota otomatis setelah simpan
              </label>

              <div className="mt-5 hidden gap-3 md:flex">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={closeTerima}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {autoPrint ? "Simpan & cetak" : "Simpan nota"}
                </Button>
              </div>
            </aside>
          </div>

          <div className="overlay-footer md:hidden">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeTerima}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-[1.4]">
              {autoPrint ? "Simpan & cetak" : "Simpan nota"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
