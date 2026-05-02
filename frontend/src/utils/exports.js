import api from '../api/axios';
import toast from 'react-hot-toast';

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(parseFloat(n) || 0) + " so'm";

export async function downloadExcel(url, filename, params = {}) {
  try {
    const response = await api.get(url, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel yuklandi!');
  } catch (err) {
    toast.error("Yuklashda xatolik");
  }
}

export function printReceipt(sale) {
  const items = sale.items || [];
  const paymentLabels = { cash: 'Naqd', terminal: 'Terminal', click: 'Click', payme: 'Payme' };
  const date = new Date(sale.date);

  const win = window.open('', '_blank', 'width=400,height=600');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Chek #${sale.id}</title>
      <style>
        @page { size: 80mm auto; margin: 5mm; }
        body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 10px; }
        h1 { text-align: center; font-size: 16px; margin: 5px 0; }
        h2 { text-align: center; font-size: 12px; margin: 0; color: #666; font-weight: normal; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
        .item-row { font-size: 12px; margin: 4px 0; }
        .item-name { font-weight: bold; }
        .item-detail { display: flex; justify-content: space-between; padding-left: 10px; color: #555; }
        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; }
        .center { text-align: center; font-size: 11px; margin-top: 15px; color: #666; }
        @media print { body { max-width: 100%; } }
      </style>
    </head>
    <body>
      <h1>NONVOYXONA</h1>
      <h2>Sotuv cheki</h2>
      <div class="divider"></div>
      <div class="row"><span>Chek №:</span><span>#${sale.id}</span></div>
      <div class="row"><span>Sana:</span><span>${date.toLocaleDateString('uz-UZ')}</span></div>
      <div class="row"><span>Vaqt:</span><span>${date.toLocaleTimeString('uz-UZ')}</span></div>
      <div class="row"><span>Sotuvchi:</span><span>${sale.seller_name || 'Admin'}</span></div>
      <div class="row"><span>To'lov:</span><span>${paymentLabels[sale.payment_type] || sale.payment_type}</span></div>
      <div class="divider"></div>
      ${items.map(it => `
        <div class="item-row">
          <div class="item-name">${it.product_name || 'Mahsulot'}</div>
          <div class="item-detail">
            <span>${it.quantity} x ${formatMoney(it.price)}</span>
            <span><b>${formatMoney(it.total_price || it.quantity * it.price)}</b></span>
          </div>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="total">JAMI: ${formatMoney(sale.total_amount)}</div>
      <div class="divider"></div>
      <div class="center">
        Xaridingiz uchun rahmat!<br>
        Yana keling 🥖
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}
