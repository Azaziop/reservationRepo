-- Script de Configuration de la Base de Données de Production
-- Reservation System

-- Créer la base de données de production
CREATE DATABASE IF NOT EXISTS reservation_prod
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE reservation_prod;

-- Créer un utilisateur dédié (optionnel mais recommandé)
-- Décommentez et modifiez si vous voulez un utilisateur spécifique
-- CREATE USER IF NOT EXISTS 'reservation_user'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise';
-- GRANT ALL PRIVILEGES ON reservation_prod.* TO 'reservation_user'@'localhost';

-- Donner tous les privilèges à root (configuration actuelle)
GRANT ALL PRIVILEGES ON reservation_prod.* TO 'root'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Afficher les informations
SELECT
    'Base de données créée avec succès!' AS Status,
    DATABASE() AS Current_Database,
    @@character_set_database AS Charset,
    @@collation_database AS Collation;

-- Afficher les tables (sera vide jusqu'à ce que les migrations soient exécutées)
SHOW TABLES;

-- Note: Les migrations Laravel créeront automatiquement les tables suivantes:
-- - users
-- - rooms
-- - reservations
-- - sessions
-- - cache
-- - jobs
-- - failed_jobs
-- - password_reset_tokens
-- - migrations
