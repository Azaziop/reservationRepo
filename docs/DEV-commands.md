# DEV commands

Guide rapide pour les développeurs — commandes PowerShell (Windows) pour démarrer le stack, appliquer migrations, seeders, lancer Liquibase, vérifier la base et dépannage.

**Pré-requis**
- Docker Desktop en marche
- Être à la racine du dépôt

**1) Démarrer le stack**
```powershell
Set-Location 'C:\Users\zaoui\OneDrive\Documents\reservationRepo'
docker compose -f docker-compose.prod.yaml up -d --build
```

**2) Vérifier l'état des services**
```powershell
docker compose -f docker-compose.prod.yaml ps
```

**3) Migrations & Seeders**
- Appliquer les migrations Laravel :
```powershell
docker exec -it reservation-php-fpm php artisan migrate --force
```
- Exécuter les seeders (si `database/seeders` présent) :
```powershell
docker exec -it reservation-php-fpm php artisan db:seed --force
```
- Restaurer les seeders supprimés depuis le dernier commit (si nécessaire) :
```powershell
git checkout HEAD -- database/seeders
docker exec -it reservation-php-fpm php artisan db:seed --force
```

**4) Liquibase**
- Si vous avez le script helper (gestion réseau/JAR) :
```powershell
.\scripts\run-liquibase.ps1
```
- Commande Liquibase manuelle (exemple) :
```powershell
docker run --rm --network reservationrepo_reservation-net `
  -v "${PWD}/database/liquibase/drivers:/liquibase/drivers" `
  -v "${PWD}/database/liquibase:/liquibase/changelog" `
  liquibase/liquibase:4.30.0 `
  --classpath=/liquibase/drivers/mysql-connector-java-8.0.30.jar `
  --changeLogFile=/liquibase/changelog/changelog.xml `
  --defaultsFile=/liquibase/changelog/liquibase.properties `
  update
```

Notes:
- Assurez-vous que le driver JDBC est présent dans `database/liquibase/drivers`.
- Si résolution DNS `mysql` échoue depuis un conteneur, ajoutez `--add-host mysql:<IP>` ou utilisez `host.docker.internal` dans l'URL JDBC.

**5) Vérification base de données**
- Lister les tables :
```powershell
docker exec reservation-mysql mysql -uroot -e "USE reservation_db; SHOW TABLES;"
```
- Compter les lignes (exemples) :
```powershell
docker exec reservation-mysql mysql -uroot -e "USE reservation_db; SELECT COUNT(*) FROM rooms;"
docker exec reservation-mysql mysql -uroot -e "USE reservation_db; SELECT COUNT(*) FROM reservations;"
```

**6) Logs & santé**
- Suivre les logs PHP-FPM :
```powershell
docker logs -f reservation-php-fpm --tail 200
```
- Suivre les logs Nginx :
```powershell
docker logs -f reservation-nginx --tail 200
```
- Tester endpoint santé (nginx sur 8080) :
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8080/health.php
```

**7) Nettoyage Docker (ATTENTION : perte de données)**
- Arrêter et supprimer conteneurs, images et volumes liés au compose :
```powershell
docker compose -f docker-compose.prod.yaml down --rmi all -v
```
- Nettoyage systémique (très agressif) :
```powershell
docker system prune -a --volumes -f
```

**8) Restaurations & commits**
- Si vous restaurez des fichiers (ex : seeders), committez-les pour partager avec l'équipe :
```powershell
git add database/seeders
git commit -m "Restore database seeders"
git push origin <branch>
```

**9) Dépannage rapide**
- Vérifier le réseau compose :
```powershell
docker network ls
docker network inspect reservationrepo_reservation-net
```
- Tester résolution DNS `mysql` depuis un conteneur diagnostic :
```powershell
docker run --rm --network reservationrepo_reservation-net curlimages/curl:latest -sS --max-time 5 http://mysql:3306
```
- Si Liquibase indique changelog introuvable : montez explicitement `database/liquibase` et fournissez `--changeLogFile` et `--defaultsFile` corrects.

--

Recommandations générales
- Ne pas exécuter automatiquement `migrate`/`seed` en production sans garde-fous.
- Conserver les seeders dans le dépôt pour éviter pertes accidentelles.
- Documenter tout changement de schéma (migrations, liquibase) dans le repo.

Optionnel — je peux :
- Ajouter ce fichier dans `docs/DEV-commands.md` (fait).
- Ajouter un `Makefile` ou petits scripts PowerShell (`scripts/dev-start.ps1`, `scripts/dev-init.ps1`) pour standardiser ces commandes.
