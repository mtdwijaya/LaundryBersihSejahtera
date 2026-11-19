import { BRAND, PAYMENT_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatKg, formatRupiah } from "@/lib/format";
import type { Order } from "@/lib/types";

type NotaReceiptProps = {
  order: Order;
  copyLabel?: string;
};

export function NotaReceipt({
  order,
  copyLabel = "Salinan pelanggan",
}: NotaReceiptProps) {
  const remaining = Math.max(order.total - order.paidAmount, 0);

  return (
    <article className="nota-receipt" aria-label={`Nota ${order.notaNumber}`}>
      <header className="nota-receipt__header">
        <p className="nota-receipt__brand">{BRAND.name}</p>
        <p>{BRAND.address}</p>
        <p>Telp. {BRAND.phone}</p>
        <p>{BRAND.hours}</p>
      </header>

      <div className="nota-receipt__divider" />

      <p className="nota-receipt__title">NOTA CUCIAN</p>
      <p className="nota-receipt__nota">{order.notaNumber}</p>
      <p className="nota-receipt__copy">{copyLabel}</p>

      <div className="nota-receipt__divider" />

      <dl className="nota-receipt__meta">
        <div>
          <dt>Tanggal</dt>
          <dd>{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt>Pelanggan</dt>
          <dd>{order.customerName}</dd>
        </div>
        <div>
          <dt>No. HP</dt>
          <dd>{order.customerPhone}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{STATUS_LABEL[order.status]}</dd>
        </div>
      </dl>

      <div className="nota-receipt__divider" />

      <table className="nota-receipt__table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="right">Qty</th>
            <th className="right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Laundry kiloan
              <br />
              <span className="muted">@ {formatRupiah(order.pricePerKg)}/kg</span>
            </td>
            <td className="right">{formatKg(order.weightKg)}</td>
            <td className="right">{formatRupiah(order.total)}</td>
          </tr>
        </tbody>
      </table>

      {order.notes ? (
        <p className="nota-receipt__notes">
          Catatan: {order.notes}
        </p>
      ) : null}

      <div className="nota-receipt__divider" />

      <dl className="nota-receipt__totals">
        <div>
          <dt>Total</dt>
          <dd>{formatRupiah(order.total)}</dd>
        </div>
        <div>
          <dt>Dibayar</dt>
          <dd>{formatRupiah(order.paidAmount)}</dd>
        </div>
        <div>
          <dt>Sisa</dt>
          <dd>{formatRupiah(remaining)}</dd>
        </div>
        <div className="strong">
          <dt>Pembayaran</dt>
          <dd>{PAYMENT_LABEL[order.paymentStatus]}</dd>
        </div>
      </dl>

      <div className="nota-receipt__divider" />

      <p className="nota-receipt__footnote">
        Simpan nota ini. Nomor nota unik dipakai untuk mencegah cucian tertukar.
        Klaim pengambilan wajib menunjukkan nota.
      </p>
      <p className="nota-receipt__thanks">Terima kasih</p>
    </article>
  );
}
