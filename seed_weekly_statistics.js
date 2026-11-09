const pool = require('./config/db');

async function seedWeeklyData() {
    try {
        console.log('--- Seeding Realistic Weekly Complaints Statistics ---');

        // Check active users in db
        const [users] = await pool.query('SELECT id, name FROM users WHERE role = "user"');
        if (users.length === 0) {
            console.error('No citizen users found.');
            process.exit(1);
        }

        const userIds = users.map(u => u.id);
        const getRandomUser = () => userIds[Math.floor(Math.random() * userIds.length)];

        // Base dates for this week (Oct 16 - Oct 22, 2026)
        // 2026-10-16 is Friday (5)
        // 2026-10-17 is Saturday (6)
        // 2026-10-18 is Sunday (0)
        // 2026-10-19 is Monday (1)
        // 2026-10-20 is Tuesday (2)
        // 2026-10-21 is Wednesday (3)
        // 2026-10-22 is Thursday (4)

        const sampleReports = [
            // --- SENIN (Monday - 2026-10-19) ---
            {
                title: 'Jalan Rusak Berlubang Dekat Gapura Masuk Desa',
                category: 'Infrastruktur Jalan',
                description: 'Aspal terkelupas cukup dalam dan membahayakan pengendara motor saat malam hari, mohon segera ditambal.',
                status: 'done',
                date: '2026-10-19 08:30:00',
                lat: -6.23450000, lng: 106.80210000
            },
            {
                title: 'Penumpukan Sampah di Pinggir Lapangan Voli',
                category: 'Kebersihan',
                description: 'Warga sekitar membuang sampah sembarangan dan belum diangkut oleh dinas kebersihan selama 2 hari.',
                status: 'approved',
                date: '2026-10-19 10:15:00',
                lat: -6.23610000, lng: 106.80430000
            },
            {
                title: 'Lampu Penerangan Lapangan RW 02 Mati',
                category: 'Lampu Jalan',
                description: 'Lampu sorot tiang utama mati mendadak, area sekitar menjadi gelap gulita.',
                status: 'process',
                date: '2026-10-19 14:20:00',
                lat: -6.23820000, lng: 106.80150000
            },
            {
                title: 'Saluran Irigasi Tersumbat Ranting Pohon',
                category: 'Kejadian Bencana',
                description: 'Ranting pohon tumbang menyumbat aliran air parit sawah warga berpotensi banjir jika hujan.',
                status: 'done',
                date: '2026-10-19 16:45:00',
                lat: -6.23900000, lng: 106.80550000
            },
            {
                title: 'Portal Keamanan Gang Melati Patah',
                category: 'Keamanan',
                description: 'Portal pembatas jalan patah tertabrak mobil bak muatan, pos ronda mohon bantuan perbaikan.',
                status: 'pending',
                date: '2026-10-19 19:10:00',
                lat: -6.23550000, lng: 106.80320000
            },

            // --- SELASA (Tuesday - 2026-10-20) ---
            {
                title: 'Lampu Jalan Utama Dusun 2 Mati Total',
                category: 'Lampu Jalan',
                description: 'Tiga titik lampu jalan padam berderet, jalur kendaraan sangat gelap dan rawan begal.',
                status: 'process',
                date: '2026-10-20 07:45:00',
                lat: -6.23320000, lng: 106.80610000
            },
            {
                title: 'Aspal Amblas di Dekat Jembatan Sungai Kecil',
                category: 'Infrastruktur Jalan',
                description: 'Tanah di bawah aspal mulai tergerus air, mobil roda empat rawan terperosok.',
                status: 'approved',
                date: '2026-10-20 09:20:00',
                lat: -6.23780000, lng: 106.80750000
            },
            {
                title: 'Bak Sampah Terbuka Menimbulkan Bau Menyengat',
                category: 'Kebersihan',
                description: 'Bak sampah umum di pasar desa sudah penuh dan meluap ke badan jalan.',
                status: 'done',
                date: '2026-10-20 11:30:00',
                lat: -6.23890000, lng: 106.80280000
            },
            {
                title: 'Ayunan Taman Bermain Anak Rusak dan Karatan',
                category: 'Fasilitas Umum',
                description: 'Rantai ayunan putus dan besi berkarat tajam, sangat berbahaya bagi anak-anak kecil.',
                status: 'pending',
                date: '2026-10-20 13:10:00',
                lat: -6.23410000, lng: 106.80390000
            },
            {
                title: 'Pencurian Tabung Gas di Warung Warga RT 03',
                category: 'Keamanan',
                description: 'Terjadi pencurian dini hari tadi, mohon patroli linmas malam ditingkatkan jadwalnya.',
                status: 'approved',
                date: '2026-10-20 15:40:00',
                lat: -6.23660000, lng: 106.80190000
            },
            {
                title: 'Papan Nama Penunjuk Arah Desa Roboh',
                category: 'Fasilitas Umum',
                description: 'Papan plang jalan roboh terkena angin kencang kemarin sore.',
                status: 'done',
                date: '2026-10-20 17:00:00',
                lat: -6.23500000, lng: 106.80800000
            },
            {
                title: 'Genangan Air di Tikungan RT 01',
                category: 'Infrastruktur Jalan',
                description: 'Air tidak mengalir setelah hujan, membentuk kubangan yang licin bagi motor.',
                status: 'process',
                date: '2026-10-20 19:25:00',
                lat: -6.23710000, lng: 106.80350000
            },

            // --- RABU (Wednesday - 2026-10-21) ---
            {
                title: 'Tebing Tanah Longsor Menutupi Setengah Jalan',
                category: 'Kejadian Bencana',
                description: 'Longsoran tanah tebing setinggi 2 meter menutup lajur kiri jalan tembus antardesa.',
                status: 'process',
                date: '2026-10-21 06:50:00',
                lat: -6.23950000, lng: 106.80900000
            },
            {
                title: 'Pohon Mangga Tua Lapuk Rawan Tumbang',
                category: 'Kejadian Bencana',
                description: 'Batang pohon condong ke arah kabel listrik PLN dan jalan raya.',
                status: 'approved',
                date: '2026-10-21 08:35:00',
                lat: -6.23380000, lng: 106.80490000
            },
            {
                title: 'Kran Air Tempat Wudhu Musholla Al-Ikhlas Bocor',
                category: 'Fasilitas Umum',
                description: 'Tiga kran patah sehingga air terbuang percuma setiap hari.',
                status: 'done',
                date: '2026-10-21 11:00:00',
                lat: -6.23600000, lng: 106.80200000
            },
            {
                title: 'Limbah Bengkel Dibuang ke Selokan Warga',
                category: 'Kebersihan',
                description: 'Oli bekas mengalir ke selokan pemukiman warga menimbulkan bau minyak menyengat.',
                status: 'pending',
                date: '2026-10-21 14:15:00',
                lat: -6.23750000, lng: 106.80650000
            },
            {
                title: 'Lampu Jalan Kedap-Kedip Menyilaukan di RT 07',
                category: 'Lampu Jalan',
                description: 'Bohlam lampu penerangan jalan rusak dan terus berkedip membuat pengendara pusing.',
                status: 'done',
                date: '2026-10-21 16:50:00',
                lat: -6.23480000, lng: 106.80120000
            },
            {
                title: 'Kabel Internet Menjuntai Terlalu Rendah',
                category: 'Lainnya',
                description: 'Kabel fiber optik menyentuh atap truk yang lewat, mohon ditata ulang.',
                status: 'approved',
                date: '2026-10-21 18:40:00',
                lat: -6.23840000, lng: 106.80500000
            },

            // --- KAMIS (Thursday - 2026-10-22 / Hari Ini) ---
            {
                title: 'Paving Block Trotoar Depan Balai Desa Rusak',
                category: 'Infrastruktur Jalan',
                description: 'Paving block copot berantakan membuat pejalan kaki tersandung.',
                status: 'pending',
                date: '2026-10-22 07:15:00',
                lat: -6.23510000, lng: 106.80300000
            },
            {
                title: 'Tumpukan Ranting Bekas Tebangan di Pinggir Jalan',
                category: 'Kebersihan',
                description: 'Ranting pohon dibiarkan menumpuk setelah penebangan minggu lalu.',
                status: 'process',
                date: '2026-10-22 08:45:00',
                lat: -6.23690000, lng: 106.80400000
            },
            {
                title: 'Tiang Penerangan Jalan Tertabrak Truk',
                category: 'Lampu Jalan',
                description: 'Tiang lampu miring 30 derajat dikhawatirkan roboh menimpa rumah warga.',
                status: 'approved',
                date: '2026-10-22 09:30:00',
                lat: -6.23800000, lng: 106.80250000
            },
            {
                title: 'Balapan Liar Remaja Setiap Malam Jumat',
                category: 'Keamanan',
                description: 'Suara knalpot brong sangat bising dan mengganggu jam istirahat warga lansia.',
                status: 'pending',
                date: '2026-10-22 10:20:00',
                lat: -6.23350000, lng: 106.80700000
            },

            // --- JUMAT (Friday - 2026-10-16) ---
            {
                title: 'Tutup Saluran Got Utama Pecah Terlindas Truk',
                category: 'Infrastruktur Jalan',
                description: 'Tutup beton gorong-gorong jebol dan membentuk lubang menganga selebar 1 meter.',
                status: 'approved',
                date: '2026-10-16 08:10:00',
                lat: -6.23720000, lng: 106.80580000
            },
            {
                title: 'Lampu Jalan Tikungan Sawah Padam',
                category: 'Lampu Jalan',
                description: 'Tikungan tajam dekat sawah sangat rawan kecelakaan karena lampu mati.',
                status: 'done',
                date: '2026-10-16 10:30:00',
                lat: -6.23880000, lng: 106.80820000
            },
            {
                title: 'Sampah Plastik Menumpuk di Bawah Jembatan Desa',
                category: 'Kebersihan',
                description: 'Banyak kantong plastik tersangkut di pilar jembatan dan memperlambat aliran air.',
                status: 'done',
                date: '2026-10-16 13:45:00',
                lat: -6.23640000, lng: 106.80370000
            },
            {
                title: 'Blower Pengering di Balai Pertanian Rusak',
                category: 'Fasilitas Umum',
                description: 'Mesin pengering gabah komunal tidak bisa menyala menjelang panen raya.',
                status: 'process',
                date: '2026-10-16 15:20:00',
                lat: -6.23460000, lng: 106.80160000
            },
            {
                title: 'Kucing Liar Terjebak di Atap Balai RW',
                category: 'Lainnya',
                description: 'Anak kucing terjebak di sela plafon balai RW dan mengeong terus menerus.',
                status: 'done',
                date: '2026-10-16 17:30:00',
                lat: -6.23590000, lng: 106.80480000
            },
            {
                title: 'Pohon Kelapa Tumbang Mengenai Pagar Rumah',
                category: 'Kejadian Bencana',
                description: 'Hujan badai semalam menyebabkan pohon kelapa tumbang menimpa pagar warga RT 06.',
                status: 'done',
                date: '2026-10-16 19:15:00',
                lat: -6.23920000, lng: 106.80690000
            },

            // --- SABTU (Saturday - 2026-10-17) ---
            {
                title: 'Keran Air Bersih di Posyandu Rusak Parah',
                category: 'Fasilitas Umum',
                description: 'Fasilitas cuci tangan untuk balita dan lansia tidak mengeluarkan air.',
                status: 'done',
                date: '2026-10-17 09:10:00',
                lat: -6.23530000, lng: 106.80270000
            },
            {
                title: 'Jalan Setapak Menuju Pemakaman Umum Becek',
                category: 'Infrastruktur Jalan',
                description: 'Tanah merah sangat licin jika dilalui peziarah saat musim hujan, butuh pengerasan kerikil.',
                status: 'process',
                date: '2026-10-17 11:25:00',
                lat: -6.23810000, lng: 106.80930000
            },
            {
                title: 'Lampu Pos Kamling RW 03 Putus',
                category: 'Lampu Jalan',
                description: 'Bohlam pos kamling mati, ronda malam terpaksa memakai lilin darurat.',
                status: 'approved',
                date: '2026-10-17 15:40:00',
                lat: -6.23670000, lng: 106.80140000
            },
            {
                title: 'Pembersihan Rumput Liar di Lapangan Sepak Bola',
                category: 'Kebersihan',
                description: 'Rumput ilalang sudah setinggi pinggang dan sarang ular di tepi lapangan.',
                status: 'pending',
                date: '2026-10-17 17:50:00',
                lat: -6.23400000, lng: 106.80520000
            },

            // --- MINGGU (Sunday - 2026-10-18) ---
            {
                title: 'Papan Pengumuman Desa Pecah Kacanya',
                category: 'Fasilitas Umum',
                description: 'Kaca etalase pengumuman depan kantor desa retak dan membahayakan warga.',
                status: 'done',
                date: '2026-10-18 08:40:00',
                lat: -6.23570000, lng: 106.80330000
            },
            {
                title: 'Got Meluap ke Jalan Saat Kerja Bakti',
                category: 'Kebersihan',
                description: 'Sedimen lumpur tebal menumpuk di saluran utama perlu bantuan pompa kuras.',
                status: 'approved',
                date: '2026-10-18 10:15:00',
                lat: -6.23760000, lng: 106.80620000
            },
            {
                title: 'Pohon Bambu Menghalangi Jalur Masuk Dusun',
                category: 'Kejadian Bencana',
                description: 'Rumpun bambu merunduk terlalu rendah menghalangi mobil ambulans dan truk sembako.',
                status: 'done',
                date: '2026-10-18 14:30:00',
                lat: -6.23980000, lng: 106.80780000
            }
        ];

        console.log(`Inserting ${sampleReports.length} complaints spanning Monday through Sunday...`);

        for (const item of sampleReports) {
            const uid = getRandomUser();
            const [result] = await pool.query(
                `INSERT INTO complaints (user_id, title, description, category, status, latitude, longitude, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [uid, item.title, item.description, item.category, item.status, item.lat, item.lng, item.date]
            );

            // Add some realistic likes
            const likeCount = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < likeCount; i++) {
                const likeUser = getRandomUser();
                await pool.query(
                    'INSERT IGNORE INTO likes (user_id, complaint_id, created_at) VALUES (?, ?, ?)',
                    [likeUser, result.insertId, item.date]
                );
            }

            // If resolved/done, add an official response from admin
            if (item.status === 'done' || item.status === 'approved') {
                await pool.query(
                    `INSERT INTO comments (user_id, complaint_id, comment, created_at) 
                     VALUES (10, ?, 'Laporan telah diverifikasi oleh petugas desa dan penanganan di lapangan selesai dilaksanakan.', ?)`,
                    [result.insertId, item.date]
                );
            }
        }

        const [counts] = await pool.query('SELECT COUNT(*) as total FROM complaints');
        console.log(`✓ Successfully seeded! Total complaints now: ${counts[0].total}`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seedWeeklyData();
