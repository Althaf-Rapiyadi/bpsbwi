-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 19, 2025 at 09:02 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `webdesaku`
--

-- --------------------------------------------------------

--
-- Table structure for table `data_statistik`
--

CREATE TABLE `data_statistik` (
  `id` int(11) NOT NULL,
  `nama_file` varchar(255) DEFAULT NULL,
  `nama_tabel` varchar(255) DEFAULT NULL,
  `deskripsi_tabel` text DEFAULT NULL,
  `path_file` varchar(255) DEFAULT NULL,
  `kategori` varchar(100) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `diupload_pada` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `data_statistik`
--

INSERT INTO `data_statistik` (`id`, `nama_file`, `nama_tabel`, `deskripsi_tabel`, `path_file`, `kategori`, `keterangan`, `diupload_pada`) VALUES
(1, 'test.csv', NULL, NULL, 'static/uploads/test.csv', 'CobaTest', NULL, '2025-07-18 17:41:23'),
(11, 'submission_best_model_v2.csv', NULL, NULL, 'static\\uploads\\79cd99edfad54583a64be548d2a62425.csv', 'Keterangan Umum Wilayah', NULL, '2025-07-19 03:05:17'),
(12, 'Nigerian_Road_Traffic_Crashes_2020_2024.csv', NULL, NULL, 'static\\uploads\\2db8b33ab315462db853c46ed21e3393.csv', 'Keterangan Umum Wilayah', NULL, '2025-07-19 03:05:40'),
(13, 'Filtered_Shopping_Data.csv', 'Filtered_Shopping_Data.csv', 'mk', 'static/uploads/8a9163bee96240e99717cda6b0ac8c08.csv', 'Keterangan Umum Wilayah', NULL, '2025-07-19 03:26:54'),
(14, 'predictions_xgb.csv', 'predictions_xgb.csv', 'ini cuma tes', 'static/uploads/07289f4f92894b4686a1fb613e4ce12f.csv', 'Keterangan Umum Wilayah', NULL, '2025-07-19 04:23:07');

-- --------------------------------------------------------

--
-- Table structure for table `publikasi`
--

CREATE TABLE `publikasi` (
  `id` int(11) NOT NULL,
  `judul` varchar(255) DEFAULT NULL,
  `tahun` int(11) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `nama_file` varchar(255) DEFAULT NULL,
  `nama_cover` varchar(255) DEFAULT NULL,
  `kategori` varchar(100) DEFAULT NULL,
  `diupload_pada` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `data_statistik`
--
ALTER TABLE `data_statistik`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `publikasi`
--
ALTER TABLE `publikasi`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `data_statistik`
--
ALTER TABLE `data_statistik`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `publikasi`
--
ALTER TABLE `publikasi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
