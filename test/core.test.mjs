import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkPages, buildIndex, answer, search } from '../src/core.js';

const pages = [
  { page: 1, text: 'Garansi produk elektronik adalah 12 bulan sejak pembelian. Garansi tidak berlaku untuk kerusakan akibat air.' },
  { page: 2, text: 'Pengiriman memakan waktu 2 sampai 4 hari ke Pulau Jawa. Ongkos kirim gratis di atas Rp500.000.' },
];

test('chunking keeps the page number of each chunk', () => {
  const chunks = chunkPages(pages);
  assert.ok(chunks.length >= 2);
  assert.deepEqual([...new Set(chunks.map(c => c.page))], [1, 2]);
});

test('answers from the right page and cites it', () => {
  const idx = buildIndex(chunkPages(pages));
  const a = answer(idx, 'berapa lama garansi?');
  assert.equal(a.grounded, true);
  assert.equal(a.citations[0].page, 1);
  assert.match(a.text, /12 bulan/);
});

test('refuses a question the document does not cover', () => {
  const idx = buildIndex(chunkPages(pages));
  const a = answer(idx, 'siapa presiden amerika?');
  assert.equal(a.grounded, false);
  assert.deepEqual(a.citations, []);
});

test('search returns nothing for an empty index', () => {
  assert.deepEqual(search(buildIndex([]), 'garansi'), []);
});
