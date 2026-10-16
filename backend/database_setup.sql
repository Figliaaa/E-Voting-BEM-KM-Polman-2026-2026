-- PEMIRA 2026-2027 Database Setup
CREATE DATABASE IF NOT EXISTS `db_pemira` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_pemira`;

-- 1. Table Admin
CREATE TABLE IF NOT EXISTS `admin` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Table Kandidat
CREATE TABLE IF NOT EXISTS `kandidat` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_ketua` VARCHAR(255) NOT NULL,
  `nama_wakil` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `foto_url` VARCHAR(255) DEFAULT NULL,
  `jumlah_suara` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `jumlah_suara` (`jumlah_suara`)
);

-- 3. Table Pemilih
CREATE TABLE IF NOT EXISTS `pemilih` (
  `nim` VARCHAR(20) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(255) NOT NULL,
  `token` VARCHAR(50) DEFAULT NULL,
  `token_diambil` TINYINT(1) DEFAULT 0,
  `status_pilih` TINYINT(1) DEFAULT 0,
  `waktu_pilih` DATETIME DEFAULT NULL,
  UNIQUE KEY `token` (`token`),
  INDEX `status_pilih` (`status_pilih`),
  INDEX `token_diambil` (`token_diambil`)
);

-- Seed Data: Admin (Password: admin123)
INSERT INTO `admin` (`username`, `password_hash`, `full_name`)
VALUES ('admin', '$2b$10$aGkS2Ny9jj27KS2QAyT/VuDaQNRGXVz8MLIogFm1fgA0JXQ/4Tjhi', 'Administrator PEMIRA')
ON DUPLICATE KEY UPDATE `password_hash` = '$2b$10$aGkS2Ny9jj27KS2QAyT/VuDaQNRGXVz8MLIogFm1fgA0JXQ/4Tjhi', `full_name` = 'Administrator PEMIRA';

-- Seed Data: Kandidat
INSERT INTO `kandidat` (`id`, `nama_ketua`, `nama_wakil`, `deskripsi`, `foto_url`, `jumlah_suara`) VALUES
(1, 'Ahmad Fauzi', 'Siti Rahmawati', 'Visi: Mewujudkan KM Polman yang adaptif, inklusif, dan berdaya saing global melalui kolaborasi teknologi dan kemahasiswaan.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 12),
(2, 'Budi Pratama', 'Dewi Lestari', 'Visi: Mengakselerasi sinergi organisasi mahasiswa demi kesejahteraan dan peningkatan kapasitas riset vokasi nasional.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 8)
ON DUPLICATE KEY UPDATE `nama_ketua` = VALUES(`nama_ketua`), `nama_wakil` = VALUES(`nama_wakil`), `deskripsi` = VALUES(`deskripsi`);

-- Seed Data: Sample Pemilih (NIM harus 9 digit, token 6 digit hex)
-- voter 1: Token aktif & belum memilih (Bisa langsung dicoba untuk voting)
INSERT INTO `pemilih` (`nim`, `nama`, `token`, `token_diambil`, `status_pilih`) VALUES
('221001001', 'Putra Maulana', 'ABC123', 1, 0),
('221001002', 'Rizky Ramadhan', 'DEF456', 1, 0),
('221001003', 'Anisa Putri', 'GHI789', 0, 0),
('221001004', 'Dwi Cahyo', 'JKL012', 0, 0)
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`), `token` = VALUES(`token`), `token_diambil` = VALUES(`token_diambil`);

