# Arah desain: DocuChat

Reading this as: aplikasi dukungan pelanggan untuk pemilik bisnis kecil, bergaya cetak editorial, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

| Keputusan | Alasan satu baris |
|---|---|
| Kertas krem, tinta hampir hitam | Produk ini soal membaca dokumen dan kutipan, jadi tampilannya meminjam halaman cetak. |
| Aksen satu warna: merah marun `#8a2b1f` | Dipakai hanya untuk penanda sitasi, tombol utama, dan fokus, supaya sitasi menonjol. |
| Source Serif 4 untuk jawaban dan judul dokumen, IBM Plex Sans untuk kontrol | Jawaban adalah teks bacaan; kontrol adalah antarmuka. Dua suara dengan peran berbeda. |
| Tiga kolom: dokumen, percakapan, sumber | Pengguna perlu melihat jawaban dan buktinya sekaligus. |
| Sudut hampir persegi (2px), tanpa bayangan | Selembar kertas tidak melayang. |
| Hanya mode terang | Konteks membaca dokumen panjang, tidak ada alasan produk untuk tema gelap. |
| Gerak: hanya fade 180 ms saat pesan muncul | Memberi tahu mata ada pesan baru, dinonaktifkan jika `prefers-reduced-motion`. |
| Wordmark teks "DocuChat" | Belum ada logo yang disetujui, jadi memakai penanda teks (R-23). |
