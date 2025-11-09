-- 🔍 Script de vérification des heures inversées
-- Exécutez ce script pour identifier les réservations avec heures inversées

-- 1. Trouver TOUTES les réservations avec heures inversées
SELECT
  id,
  employee_id,
  room_id,
  date,
  start_time,
  end_time,
  duration_minutes,
  created_at,
  CASE
    WHEN start_time >= end_time THEN 'INVERSÉ ❌'
    ELSE 'OK ✅'
  END as status
FROM reservations
ORDER BY created_at DESC
LIMIT 50;

-- 2. Compter les réservations problématiques
SELECT COUNT(*) as total_inversions
FROM reservations
WHERE start_time >= end_time;

-- 3. Identifier les réservations à corriger (détail complet)
SELECT
  id,
  employee_id,
  room_id,
  date,
  start_time,
  end_time,
  start_time as current_start,
  end_time as current_end,
  end_time as should_be_start,
  start_time as should_be_end
FROM reservations
WHERE start_time >= end_time
ORDER BY date DESC, start_time DESC;

-- 4. Calculer les statistiques
SELECT
  COUNT(*) as total_reservations,
  COUNT(CASE WHEN start_time >= end_time THEN 1 END) as inversions,
  ROUND(COUNT(CASE WHEN start_time >= end_time THEN 1 END) * 100.0 / COUNT(*), 2) as inversion_percentage
FROM reservations;

-- 5. Afficher les réservations récentes (dernières 20)
SELECT
  id,
  employee_id,
  room_id,
  date,
  start_time,
  end_time,
  duration_minutes,
  created_at
FROM reservations
ORDER BY created_at DESC
LIMIT 20;
