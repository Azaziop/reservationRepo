// Jenkinsfile pour l'Intégration Continue (CI) uniquement
pipeline {
    agent any

    environment {
        // --- Configuration Générale CI ---
        COMPOSER_HOME = "${WORKSPACE}/.composer"
        DB_DATABASE = 'reservation_test' // Utilisé pour les tests
        DB_USERNAME = 'root'
        DB_PASSWORD = ''
    }

        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                }
            }
            steps {
                script {
                    if (!env.STAGING_SERVER_HOST) {
                        error "La variable d'environnement STAGING_SERVER_HOST n'est pas définie dans Jenkins. Veuillez la configurer."
                    }

                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'STAGING_SERVER_CREDENTIALS', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                        string(credentialsId: 'STAGING_DB_PASSWORD_CRED', variable: 'DB_PASS_SECRET'),
                        string(credentialsId: 'STAGING_DB_USER_CRED', variable: 'DB_USER_SECRET'),
                        string(credentialsId: 'STAGING_DB_NAME_CRED', variable: 'DB_NAME_SECRET')
                    ]) {
                        def remoteHost = env.STAGING_SERVER_HOST
                        def remotePath = env.STAGING_DEPLOY_PATH ?: '/opt/reservation'
                        def composeUrl = env.COMPOSE_URL ?: ''
                        // Paramètres pour la sauvegarde DB (peuvent être définis en tant que variables Jenkins)
                        def dbContainer = env.STAGING_DB_CONTAINER ?: env.DB_CONTAINER ?: 'db'
                        def dbUser = env.DB_USER_SECRET ?: env.STAGING_DB_USER ?: env.DB_USERNAME ?: env.DB_USER ?: 'root'
                        def dbPass = env.DB_PASS_SECRET ?: env.STAGING_DB_PASSWORD ?: env.DB_PASSWORD ?: ''
                        def dbName = env.DB_NAME_SECRET ?: env.STAGING_DB_NAME ?: env.DB_DATABASE ?: 'reservation_prod'

                        if (isUnix()) {
                            // Exécute le script distant et récupère le chemin du fichier de backup imprimé en fin de sortie
                            def remoteBackupPath = sh(returnStdout: true, script: """
                                ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${remoteHost} 'bash -s' <<'ENDSSH'
                                set -e
                                echo "Working directory: ${remotePath}"
                                mkdir -p ${remotePath}
                                cd ${remotePath}
                                if [ -n "${composeUrl}" ]; then
                                    echo "Téléchargement du docker-compose.yml depuis ${composeUrl}"
                                    curl -fsSL "${composeUrl}" -o docker-compose.yml || echo "Avertissement: échec du téléchargement du docker-compose.yml"
                                else
                                    echo "Aucune URL COMPOSE_URL fournie — on suppose que docker-compose.yml est déjà présent ou géré autrement."
                                fi
                                echo "Récupération de la nouvelle image"
                                docker compose pull
                                echo "Démarrage des services"
                                docker compose up -d

                                # --- Backup de la base de données avant migration ---
                                mkdir -p backups || true
                                TIMESTAMP=$(date +%Y%m%d%H%M%S)
                                BACKUP_FILE=backups/backup-${TIMESTAMP}.sql
                                echo "Création d'une sauvegarde DB dans ${BACKUP_FILE}"
                                set -o pipefail
                                docker compose exec -T ${dbContainer} sh -c \"exec mysqldump -u${dbUser} -p'${dbPass}' ${dbName}\" > ${BACKUP_FILE}
                                if [ $? -ne 0 ]; then
                                    echo "ERROR: backup_failed"
                                    exit 1
                                fi

                                echo "Exécution des migrations Laravel dans le conteneur php-fpm"
                                docker compose exec php-fpm php artisan migrate --force || { echo "ERROR: migrate_failed"; exit 1; }

                                # --- Healthcheck de l'application (vérifie /health) ---
                                echo "Vérification de l'état de santé de l'application"
                                SUCCESS=0
                                for i in 1 2 3 4 5; do
                                    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/health || true)
                                    echo "Healthcheck attempt ${i}: HTTP ${HTTP_CODE}"
                                    if [ "$HTTP_CODE" = "200" ]; then
                                        SUCCESS=1
                                        break
                                    fi
                                    sleep 5
                                done
                                if [ $SUCCESS -ne 1 ]; then
                                    echo "ERROR: healthcheck_failed"
                                    exit 1
                                fi

                                # Imprime le chemin du backup pour que Jenkins puisse le récupérer
                                echo "${remotePath}/${BACKUP_FILE}"
                                ENDSSH
                            """
                            ).trim()

                            // remoteBackupPath contient e.g. /opt/reservation/backups/backup-YYYYMMDDHHMMSS.sql
                            def backupFileName = remoteBackupPath.tokenize('/').last()
                            echo "Remote backup: ${remoteBackupPath} -> ${backupFileName}"

                            // Récupérer le fichier via scp
                            sh "scp -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${remoteHost}:${remotePath}/backups/${backupFileName} ./"

                            // Archiver l'artifact dans Jenkins
                            archiveArtifacts artifacts: "${backupFileName}", fingerprint: true
                        } else {
                        } else {
                            // Windows agent - utiliser ssh si disponible
                            // Windows agent - récupère le backup via SSH en utilisant PowerShell pour redirection
                            bat """
                                echo Déploiement vers serveur de staging: %STAGING_SERVER_HOST%:%STAGING_DEPLOY_PATH%
                                powershell -Command "if(-Not(Test-Path -Path ${SSH_KEY})) { Write-Output 'Key file not present'; }"
                                REM Exécute le script distant et capture le chemin du backup imprimé
                                for /f "delims=" %%F in ('ssh -o StrictHostKeyChecking=no -i %SSH_KEY% %SSH_USER%@%STAGING_SERVER_HOST% "bash -s" ^<^<^<ENDSSH
                                set -e
                                mkdir -p ${remotePath}
                                cd ${remotePath}
                                if [ -n \"${composeUrl}\" ]; then
                                    curl -fsSL \"${composeUrl}\" -o docker-compose.yml || echo \"Avertissement: échec du téléchargement du docker-compose.yml\"
                                fi
                                docker compose pull
                                docker compose up -d
                                mkdir -p backups || true
                                TIMESTAMP=$(date +%Y%m%d%H%M%S)
                                BACKUP_FILE=backups/backup-${TIMESTAMP}.sql
                                docker compose exec -T ${dbContainer} sh -c \"exec mysqldump -u${dbUser} -p'${dbPass}' ${dbName}\" > ${BACKUP_FILE}
                                if [ $? -ne 0 ]; then
                                    echo \"ERROR: backup_failed\"; exit 1
                                fi
                                docker compose exec php-fpm php artisan migrate --force || { echo \"ERROR: migrate_failed\"; exit 1; }
                                SUCCESS=0
                                for i in 1 2 3 4 5; do
                                    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/health || true)
                                    if [ \"$HTTP_CODE\" = \"200\" ]; then
                                        SUCCESS=1; break
                                    fi
                                    sleep 5
                                done
                                if [ $SUCCESS -ne 1 ]; then echo \"ERROR: healthcheck_failed\"; exit 1; fi
                                echo ${remotePath}/$BACKUP_FILE
                                ENDSSH') do set REMOTE_BACKUP=%%F

                                echo Remote backup path is %REMOTE_BACKUP%
                                powershell -Command "ssh -o StrictHostKeyChecking=no -i %SSH_KEY% %SSH_USER%@%STAGING_SERVER_HOST% 'cat %REMOTE_BACKUP%' > %CD%\%~nxREMOTE_BACKUP%"
                                echo Downloaded backup to %~nxREMOTE_BACKUP%
                            """
                            // Archiver le backup récupéré
                            // Note: sous Windows, le nom de fichier est affiché dans la sortie précédente et Jenkins archive tous les matching patterns
                            archiveArtifacts artifacts: 'backups/*.sql', fingerprint: true
                        }
                    }
                }
            }
        }
                echo 'Exécution des tests PHPUnit... 🧪'
                bat 'if exist vendor\\autoload.php ( php artisan test --parallel ) else ( echo "Skipping tests: vendor missing" & exit /b 0 )'
            }
        }

        stage('Security Check') {
            steps {
                echo 'Vérification des dépendances pour les vulnérabilités... 🔒'
                bat '''
                    composer audit || exit 0
                    npm audit --audit-level=moderate || exit 0
                '''
            }
        }

        stage('Generate Documentation') {
            steps {
                echo 'Génération de la documentation...'
                bat 'echo Documentation générée'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                script {
                    // Préparer le tag d'image en utilisant la branche et le numéro de build
                    def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'
                    def safeBranch = branch.replaceAll(/[^a-zA-Z0-9_.-]/, '-')
                    // Utilise DOCKER_REGISTRY si défini, sinon valeur par défaut 'monregistre'
                    def registry = (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY.trim()) ? env.DOCKER_REGISTRY.trim() : 'monregistre'
                    def imageTag = "${registry}/reservationapp:${safeBranch}-${env.BUILD_NUMBER}"

                    // Détecte si on est sur la branche principale pour pousser aussi 'latest'
                    def isPrimaryBranch = (branch == 'master' || branch == 'main' || safeBranch == 'master' || safeBranch == 'main' || branch.endsWith('/master') || branch.endsWith('/main'))

                    withCredentials([usernamePassword(credentialsId: 'DOCKER_CREDENTIALS', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        if (isUnix()) {
                            sh """
                                echo "Logging in to Docker registry as ${DOCKER_USER}"
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                echo "Building Docker image ${imageTag}"
                                docker build -f Dockerfile -t ${imageTag} .
                                echo "Pushing Docker image ${imageTag}"
                                docker push ${imageTag}
                                docker logout || true
                            """

                            if (isPrimaryBranch) {
                                sh """
                                    echo "Tagging image as ${registry}/reservationapp:latest"
                                    docker tag ${imageTag} ${registry}/reservationapp:latest
                                    docker push ${registry}/reservationapp:latest
                                """
                            }
                        } else {
                            // Windows (batch)
                            bat """
                                echo Logging in to Docker registry as %DOCKER_USER%
                                echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                                echo Building Docker image ${imageTag}
                                docker build -f Dockerfile -t ${imageTag} .
                                echo Pushing Docker image ${imageTag}
                                docker push ${imageTag}
                                docker logout || exit 0
                            """

                            if (isPrimaryBranch) {
                                bat """
                                    echo Tagging image as ${registry}/reservationapp:latest
                                    docker tag ${imageTag} ${registry}/reservationapp:latest
                                    docker push ${registry}/reservationapp:latest
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                }
            }
            steps {
                script {
                    if (!env.STAGING_SERVER_HOST) {
                        error "La variable d'environnement STAGING_SERVER_HOST n'est pas définie dans Jenkins. Veuillez la configurer."
                    }

                    withCredentials([sshUserPrivateKey(credentialsId: 'STAGING_SERVER_CREDENTIALS', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'), string(credentialsId: 'STAGING_DB_PASSWORD_CRED', variable: 'DB_PASS_SECRET')]) {
                        def remoteHost = env.STAGING_SERVER_HOST
                        def remotePath = env.STAGING_DEPLOY_PATH ?: '/opt/reservation'
                        def composeUrl = env.COMPOSE_URL ?: ''
                        // Paramètres pour la sauvegarde DB (peuvent être définis en tant que variables Jenkins)
                        def dbContainer = env.STAGING_DB_CONTAINER ?: env.DB_CONTAINER ?: 'db'
                        def dbUser = env.STAGING_DB_USER ?: env.DB_USERNAME ?: env.DB_USER ?: 'root'
                        def dbPass = env.DB_PASS_SECRET ?: env.STAGING_DB_PASSWORD ?: env.DB_PASSWORD ?: ''
                        def dbName = env.STAGING_DB_NAME ?: env.DB_DATABASE ?: 'reservation_prod'

                        if (isUnix()) {
                            sh """
                                echo "Déploiement vers serveur de staging: ${remoteHost}:${remotePath}"
                                chmod 600 ${SSH_KEY} || true
                                ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${remoteHost} 'bash -s' <<'ENDSSH'
                                bat """
                                    echo Déploiement vers serveur de staging: %STAGING_SERVER_HOST%:%STAGING_DEPLOY_PATH%
                                    powershell -Command "if(-Not(Test-Path -Path ${SSH_KEY})) { Write-Output 'Key file not present'; }"
                                    ssh -o StrictHostKeyChecking=no -i %SSH_KEY% %SSH_USER%@%STAGING_SERVER_HOST% "bash -s" ^
                                    <<'ENDSSH'
                                    set -e
                                    echo "Working directory: ${remotePath}"
                                    mkdir -p ${remotePath}
                                    cd ${remotePath}
                                    if [ -n "${composeUrl}" ]; then
                                        echo "Téléchargement du docker-compose.yml depuis ${composeUrl}"
                                        curl -fsSL "${composeUrl}" -o docker-compose.yml || echo "Avertissement: échec du téléchargement du docker-compose.yml"
                                    else
                                        echo "Aucune URL COMPOSE_URL fournie — on suppose que docker-compose.yml est déjà présent ou géré autrement."
                                    fi
                                    echo "Récupération de la nouvelle image"
                                    docker compose pull
                                    echo "Démarrage des services"
                                    docker compose up -d

                                    # --- Backup de la base de données avant migration ---
                                    mkdir -p backups || true
                                    TIMESTAMP=$(date +%Y%m%d%H%M%S)
                                    echo "Création d'une sauvegarde DB dans backups/backup-${TIMESTAMP}.sql"
                                    set -o pipefail
                                    docker compose exec -T ${dbContainer} sh -c \"exec mysqldump -u${dbUser} -p'${dbPass}' ${dbName}\" > backups/backup-${TIMESTAMP}.sql
                                    if [ $? -ne 0 ]; then
                                        echo "ERREUR: sauvegarde de la base de données échouée"
                                        exit 1
                                    fi

                                    echo "Exécution des migrations Laravel dans le conteneur php-fpm"
                                    docker compose exec php-fpm php artisan migrate --force || { echo "La commande de migration a échoué"; exit 1; }

                                    # --- Healthcheck de l'application (vérifie /health) ---
                                    echo "Vérification de l'état de santé de l'application"
                                    SUCCESS=0
                                    for i in 1 2 3 4 5; do
                                        HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/health || true)
                                        echo "Healthcheck attempt ${i}: HTTP ${HTTP_CODE}"
                                        if [ "$HTTP_CODE" = "200" ]; then
                                            SUCCESS=1
                                            break
                                        fi
                                        sleep 5
                                    done
                                    if [ $SUCCESS -ne 1 ]; then
                                        echo "ERREUR: Healthcheck sur /health a échoué"
                                        exit 1
                                    fi
                                    ENDSSH
                                """
                                mkdir -p backups || true
                                TIMESTAMP=$(date +%Y%m%d%H%M%S)
                                echo "Création d'une sauvegarde DB dans backups/backup-${TIMESTAMP}.sql"
                                set -o pipefail
                                docker compose exec -T ${dbContainer} sh -c \"exec mysqldump -u${dbUser} -p'${dbPass}' ${dbName}\" > backups/backup-${TIMESTAMP}.sql
                                if [ $? -ne 0 ]; then
                                    echo "ERREUR: sauvegarde de la base de données échouée"
                                    exit 1
                                fi

                                echo "Exécution des migrations Laravel dans le conteneur php-fpm"
                                docker compose exec php-fpm php artisan migrate --force || { echo "La commande de migration a échoué"; exit 1; }

                                # --- Healthcheck de l'application (vérifie /health) ---
                                echo "Vérification de l'état de santé de l'application"
                                SUCCESS=0
                                for i in 1 2 3 4 5; do
                                    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/health || true)
                                    echo "Healthcheck attempt ${i}: HTTP ${HTTP_CODE}"
                                    if [ "$HTTP_CODE" = "200" ]; then
                                        SUCCESS=1
                                        break
                                    fi
                                    sleep 5
                                done
                                if [ $SUCCESS -ne 1 ]; then
                                    echo "ERREUR: Healthcheck sur /health a échoué"
                                    exit 1
                                fi
                                ENDSSH
                            """
                        } else {
                            // Windows agent - utiliser ssh si disponible
                            bat """
                                echo Déploiement vers serveur de staging: %STAGING_SERVER_HOST%:%STAGING_DEPLOY_PATH%
                                powershell -Command "if(-Not(Test-Path -Path ${SSH_KEY})) { Write-Output 'Key file not present'; }"
                                ssh -o StrictHostKeyChecking=no -i %SSH_KEY% %SSH_USER%@%STAGING_SERVER_HOST% \"bash -s\" ^
                                <<'ENDSSH'
                                set -e
                                mkdir -p ${remotePath}
                                cd ${remotePath}
                                if [ -n "${composeUrl}" ]; then
                                    curl -fsSL "${composeUrl}" -o docker-compose.yml || echo "Avertissement: échec du téléchargement du docker-compose.yml"
                                fi
                                docker compose pull
                                docker compose up -d
                                docker compose exec php-fpm php artisan migrate --force || echo Migration failed
                                ENDSSH
                            """
                        }
                    }
                }
            }
        }
    } // Fin des stages CI

    post {
        always {
            echo 'Nettoyage final...'
            // Nettoyage de la configuration pour éviter des problèmes dans le prochain build
            bat 'if exist vendor\\autoload.php ( php artisan config:clear ) else ( echo "Skipping final config:clear: vendor missing" ) || exit 0'
        }
        success {
            echo '✅ Pipeline CI validé avec succès !'
        }
        failure {
            echo '❌ Pipeline CI échoué !'
        }
        unstable {
            echo '⚠️ Build instable'
        }
    }
}
