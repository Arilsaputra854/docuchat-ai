import { chunkPages, buildIndex, answer } from './src/core.js';

const SAMPLE = `Kebijakan Garansi. Semua produk elektronik mendapat garansi resmi selama 12 bulan sejak tanggal pembelian. Garansi tidak berlaku untuk kerusakan akibat air atau jatuh.
Klaim garansi diajukan melalui email support dengan melampirkan nota pembelian. Proses verifikasi memakan waktu maksimal 3 hari kerja.\f
Pengiriman. Pesanan sebelum pukul 15.00 dikirim di hari yang sama. Estimasi tiba 2 sampai 4 hari untuk Pulau Jawa dan 5 sampai 8 hari untuk luar Jawa. Ongkos kirim gratis untuk belanja di atas Rp500.000.\f
Pengembalian Barang. Pelanggan dapat mengembalikan barang dalam 7 hari jika produk cacat atau salah kirim. Dana dikembalikan ke metode pembayaran awal dalam 5 hari kerja. Barang yang sudah dipakai tidak dapat dikembalikan.
Jam Operasional. Layanan pelanggan aktif Senin sampai Sabtu pukul 09.00 sampai 17.00 WIB.`;

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let index = null, busy = false, lastCites = [];
const log = [];

const EMBED = `<script src="https://arilsaputra854.github.io/docuchat-ai/widget.js"\n        data-tenant="demo-tenant" defer><\/script>`;
$('#embed').textContent = EMBED;
$('#copy').onclick = async () => { try { await navigator.clipboard.writeText(EMBED); $('#copy').textContent = 'Tersalin'; } catch { $('#copy').textContent = 'Salin manual dari kotak di atas'; } };

// tabs
document.querySelectorAll('[role=tab]').forEach(t => t.onclick = () => {
  document.querySelectorAll('[role=tab]').forEach(x => { x.setAttribute('aria-selected', x === t); $('#' + x.getAttribute('aria-controls')).hidden = x !== t; });
});

function status(kind, text) { $('#status').innerHTML = text ? `<p class="${kind}">${esc(text)}</p>` : ''; }

function loadPages(pages, name) {
  const chunks = chunkPages(pages); index = buildIndex(chunks);
  $('#docs').innerHTML = `<div class="doc"><b>${esc(name)}</b><span>${pages.length} halaman, ${chunks.length} potongan teks terindeks</span></div>`;
  $('#thread').innerHTML = ''; $('#sources').innerHTML = '<p class="empty">Kutipan dari dokumen muncul di sini setelah ada jawaban.</p>';
  status('', ''); $('#q').focus();
}

$('#sample').onclick = () => loadPages(SAMPLE.split('\f').map((text, i) => ({ page: i + 1, text })), 'Contoh SOP toko');

$('#file').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  status('loading', 'Membaca dokumen...');
  try {
    if (f.name.toLowerCase().endsWith('.pdf')) {
      const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise, pages = [];
      for (let i = 1; i <= pdf.numPages; i++) { const t = await (await pdf.getPage(i)).getTextContent(); pages.push({ page: i, text: t.items.map(x => x.str).join(' ') }); }
      if (!pages.some(p => p.text.trim())) throw new Error('PDF ini tidak berisi teks (mungkin hasil pindai).');
      loadPages(pages, f.name);
    } else {
      const text = await f.text(); if (!text.trim()) throw new Error('Berkas kosong.');
      const parts = text.split('\f').flatMap(p => p.length > 1800 ? p.match(/[\s\S]{1,1800}(?:\s|$)/g) : [p]);
      loadPages(parts.map((t, i) => ({ page: i + 1, text: t })), f.name);
    }
  } catch (err) { status('error', 'Gagal membaca berkas: ' + err.message); }
};

function renderLog() {
  $('#logbox').innerHTML = log.length ? `<table><thead><tr><th>Waktu</th><th>Pertanyaan</th><th>Hasil</th></tr></thead><tbody>${log.map(l => `<tr><td>${l.t}</td><td>${esc(l.q)}</td><td>${l.ok ? 'Dijawab dari dokumen' : 'Tidak ada di dokumen'}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Belum ada pertanyaan.</p>';
}

function showSources(cites, focus) {
  lastCites = cites;
  $('#sources').innerHTML = cites.length ? cites.map(c => `<div class="src${c.ref === focus ? ' hit' : ''}" id="s${c.ref}"><b>[${c.ref}] Halaman ${c.page}</b><p>${esc(c.snippet)}...</p></div>`).join('') : '<p class="empty">Tidak ada kutipan, karena dokumen tidak memuat jawabannya.</p>';
}

$('#f').onsubmit = async e => {
  e.preventDefault(); const q = $('#q').value.trim(); if (!q || busy) return;
  if (!index) { status('error', 'Belum ada dokumen. Muat contoh SOP atau unggah berkas dulu.'); return; }
  status('', ''); $('#q').value = ''; busy = true; $('#send').disabled = true;
  const th = $('#thread');
  th.insertAdjacentHTML('beforeend', `<div class="msg u"><small>Pelanggan</small><p>${esc(q)}</p></div>`);
  const r = answer(index, q); log.unshift({ t: new Date().toLocaleTimeString('id-ID'), q, ok: r.grounded }); renderLog();
  th.insertAdjacentHTML('beforeend', `<div class="msg a${r.grounded ? '' : ' refused'}"><small>DocuChat</small><p></p></div>`);
  const p = th.lastElementChild.querySelector('p');
  let shown = '';
  for (const w of r.text.split(/(\s+)/)) { shown += w; p.innerHTML = esc(shown).replace(/\[(\d)\]/g, '<sup class="ref" data-r="$1">[$1]</sup>'); th.scrollTop = th.scrollHeight; await new Promise(r => setTimeout(r, 14)); }
  showSources(r.citations); busy = false; $('#send').disabled = false; $('#q').focus();
};
$('#thread').onclick = e => { const r = e.target.dataset.r; if (r) { showSources(lastCites, +r); $('#s' + r)?.scrollIntoView({ block: 'nearest' }); } };
