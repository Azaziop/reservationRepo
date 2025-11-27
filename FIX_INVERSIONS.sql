-- 🔧 Script de correction des heures inversées en base de données
-- ⚠️ ATTENTION: Sauvegardez votre base de données avant de lancer ce script!

-- 1. Afficher les réservations avant correction
SELECT
  'AVANT' as status,
  id,
  start_time,
  end_time,
  duration_minutes
FROM reservations
WHERE start_time >= end_time
LIMIT 10;

-- 2. CORRECTION: Inverser les heures pour les réservations problématiques
UPDATE reservations
SET
  start_time = end_time,
  end_time = start_time
WHERE start_time >= end_time;

-- 3. Recalculer la durée en minutes pour les réservations corrigées
UPDATE reservations r
SET duration_minutes =
  EXTRACT(EPOCH FROM (r.end_time::time - r.start_time::time)) / 60
WHERE start_time >= end_time;

-- 4. Afficher les réservations après correction
SELECT
  'APRÈS' as status,
  id,
  start_time,
  end_time,
  duration_minutes
FROM reservations
WHERE id IN (
  SELECT id FROM reservations
  ORDER BY created_at DESC
  LIMIT 10
);

-- 5. Vérifier qu'il n'y a plus d'inversions
SELECT COUNT(*) as remaining_inversions
FROM reservations
WHERE start_time >= end_time;

-- Si le résultat est 0, alors ✅ TOUS LES CORRECTIFS SONT APPLIQUÉS!
