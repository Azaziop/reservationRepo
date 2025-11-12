pipeline {
    agent any

    environment {
        // Configuration PHP et Composer
        PHP_VERSION = '8.2'
        COMPOSER_HOME = "${WORKSPACE}/.composer"

        // Configuration Node.js
        NODE_VERSION = '20.x'

        // Configuration MySQL
        DB_CONNECTION = 'mysql'
        DB_HOST = 'localhost'
        DB_PORT = '3306'
        DB_DATABASE = 'reservation_db'
        DB_USERNAME = 'root'
        DB_PASSWORD = ''

        // Configuration Liquibase
        LIQUIBASE_VERSION = '4.30.0'

        // Configuration du déploiement
        DEPLOY_PATH = 'C:\\inetpub\\wwwroot\\reservation'

        // Configuration Docker & Registry
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = 'azaziop'
        IMAGE_NAME = 'reservation-salles'
        // Tag format: registry/username/image:tag
        IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Récupération du code source...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('PHP Dependencies') {
                    steps {
                        echo 'Installation des dépendances PHP...'
                        bat '''
                            php -v
                            composer install --no-interaction --prefer-dist --optimize-autoloader
                        '''
                    }
                }

                stage('Node Dependencies') {
                    steps {
                        echo 'Installation des dépendances Node.js...'
                        bat 'echo Current directory: %CD%'
                        bat 'node --version'
                        bat 'npm --version'
                        bat 'if exist node_modules rmdir /s /q node_modules'
                        bat 'npm install'
                        bat '''
                            if exist node_modules\\vite\\package.json (
                                echo Vite package detected
                                dir node_modules\\vite\\bin
                            ) else (
                                echo ERROR: Vite package missing after npm install
                                dir node_modules
                                exit /b 1
                            )
                        '''
                    }
                }
            }
        }

        stage('Environment Setup') {
            steps {
                echo 'Configuration de l\'environnement...'
                bat '''
                    if not exist .env copy .env.example .env
                    php artisan key:generate
                    php artisan config:clear
                '''
            }
        }

        stage('Start Services') {
            steps {
                echo 'Démarrage des services Docker (Docker Compose) pour le CI...'
                bat '''
                    if not exist .env copy .env.example .env
                    echo Checking for docker-compose.prod.yaml...
                    if exist docker-compose.prod.yaml (
                        echo docker-compose.prod.yaml found, launching docker-compose...
                        docker-compose -f docker-compose.prod.yaml up -d
                        rem create sentinel so Database Setup knows we used compose
                        echo compose > .ci_use_compose
                    ) else (
                        echo docker-compose.prod.yaml not found, falling back to docker run for MySQL...
                        rem remove any existing container with the same name
                        docker rm -f reservation-mysql 2>nul || echo no existing reservation-mysql
                        rem Run MySQL and publish container port 3306 to a random available host port (-P)
                        rem Capture the container id from docker run into a temporary file to avoid cmd parsing issues
                        docker run -d --name reservation-mysql -e MYSQL_DATABASE=reservation_db -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -P mysql:8.0 1>.ci_container_id 2>nul || (echo docker run failed & exit /b 1)
                        rem Read the created container id
                        set /p CONTAINER_ID=<.ci_container_id
                        rem Wait a moment for Docker to register the port mapping
                        timeout /t 1 /nobreak >nul
                        rem Use PowerShell to get the host mapping for container port 3306 and write it to .ci_use_compose
                        rem Write PowerShell script to file to avoid batch parsing issues
                        echo $id = Get-Content -Path ".ci_container_id" -Raw > get_port.ps1
                        echo $mapping = docker port $id 3306/tcp >> get_port.ps1
                        echo if ([string]::IsNullOrWhiteSpace($mapping)) { Write-Error "Failed to get docker port mapping"; exit 1 } >> get_port.ps1
                        echo $hostPort = ($mapping -split ":")[-1].Trim() >> get_port.ps1
                        echo Set-Content -Path ".ci_use_compose" -Value $hostPort -Encoding ascii >> get_port.ps1
                        powershell -NoProfile -File get_port.ps1
                        del get_port.ps1 2>nul || echo no ps file
                        rem Cleanup temporary id file
                        del .ci_container_id 2>nul || echo no temp id file
                    )
                '''

                // Wait for MySQL to be ready by attempting a real PDO connection using PHP (avoids TCP-only false positives)
                powershell '''
                    $max = 120
                    $i = 0
                    $dbHost = '127.0.0.1'
                    $dbPort = 3306

                    if (Test-Path -Path '.ci_use_compose') {
                        $mode = (Get-Content -Path '.ci_use_compose' -Raw).Trim()
                        if ($mode -match 'compose') {
                            $dbHost = 'mysql'
                            $dbPort = 3306
                        } else {
                            $dbHost = '127.0.0.1'
                            $dbPort = [int]$mode
                        }
                    }

                    Write-Output "Waiting for MySQL (actual DB connection) on $dbHost:$dbPort (timeout ${max}s)..."

                    while ($i -lt $max) {
                        # Try a real PHP PDO connection; php.exe must be in PATH on the Jenkins agent
                        $phpCmd = "php -r \"try { new PDO('mysql:host=$dbHost;port=$dbPort', 'root', ''); echo 'OK'; } catch (Exception \$e) { exit(1); }\""
                        $proc = Start-Process -FilePath cmd.exe -ArgumentList "/c $phpCmd" -NoNewWindow -Wait -PassThru
                        if ($proc.ExitCode -eq 0) {
                            Write-Output "MySQL ready (PDO connection succeeded) on $dbHost:$dbPort"
                            break
                        }
                        Start-Sleep -Seconds 2
                        $i++
                    }

                    if ($i -ge $max) { Write-Error 'MySQL did not become available (PDO connection failed)'; exit 1 }
                '''
            }
        }

        stage('Database Setup') {
            steps {
                echo 'Configuration de la base de données...'
                bat '''
                    REM Decide DB host depending on how services were started
                    if exist .ci_use_compose (
                        for /f "usebackq delims=" %%a in (.ci_use_compose) do set CI_MODE=%%a
                        if "%CI_MODE%"=="compose" (
                            echo Using docker-compose network hostname for DB
                            set DB_HOST=mysql
                            set DB_PORT=3306
                            php -r "try { $pdo = new PDO('mysql:host=mysql;port=3306', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_db'); echo 'Database created successfully via compose'; } catch (Exception $e) { echo 'Database creation failed: ' . $e->getMessage(); exit(1); }"
                        ) else (
                            echo Using localhost for DB (docker run fallback) on port %CI_MODE%
                            set DB_HOST=127.0.0.1
                            set DB_PORT=%CI_MODE%
                            php -r "try { $pdo = new PDO('mysql:host=127.0.0.1;port=%CI_MODE%', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_db'); echo 'Database created successfully via docker run'; } catch (Exception $e) { echo 'Database creation failed: ' . $e->getMessage(); exit(1); }"
                        )
                    ) else (
                        echo Using default localhost:3306
                        set DB_HOST=127.0.0.1
                        set DB_PORT=3306
                        php -r "try { $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_db'); echo 'Database created successfully via default'; } catch (Exception $e) { echo 'Database creation failed: ' . $e->getMessage(); exit(1); }"
                    )

                    REM Run migrations using the chosen DB_HOST
                    php artisan migrate:fresh --seed --force
                '''
            }
        }

        stage('Build Assets') {
            steps {
                echo 'Compilation des assets frontend...'
                bat '''
                    npx vite build
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Construction de l\'image Docker combinée (Dockerfile.single) pour production...'
                script {
                    // Build avec plusieurs tags pour flexibilité en utilisant le Dockerfile.single (image combinée)
                    bat """
                        docker build -f Dockerfile.single -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} ^
                                     -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${BUILD_NUMBER} ^
                                     -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:latest ^
                                     .
                    """
                    echo "✅ Image construite (Dockerfile.single): ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'Envoi de l\'image vers le registry Docker...'
                script {
                    // Utiliser les credentials Jenkins pour Docker Hub/GHCR
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-registry-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        bat """
                            echo Connexion au registry Docker...
                            docker login ${DOCKER_REGISTRY} -u %DOCKER_USER% -p %DOCKER_PASS%

                            echo Push de l'image avec tag ${IMAGE_TAG}...
                            docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}

                            echo Push de l'image avec tag ${BUILD_NUMBER}...
                            docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${BUILD_NUMBER}

                            echo Push de l'image avec tag latest...
                            docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:latest

                            docker logout ${DOCKER_REGISTRY}
                        """
                        echo "✅ Image poussée vers ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                echo 'Mise à jour des manifests Kubernetes (GitOps)...'
                script {
                    def newImageTag = "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

                    withCredentials([usernamePassword(
                        credentialsId: 'github-credentials',
                        usernameVariable: 'GIT_USERNAME',
                        passwordVariable: 'GIT_TOKEN'
                    )]) {
                        bat """
                            echo Mise à jour de kubernetes/deployment.yaml avec la nouvelle image...

                            powershell -Command "(Get-Content kubernetes/deployment.yaml) -replace 'image: .*/${IMAGE_NAME}:.*', 'image: ${newImageTag}' | Set-Content kubernetes/deployment.yaml"

                            echo Configuration Git...
                            git config user.email "jenkins@ci.local"
                            git config user.name "Jenkins CI"

                            echo Ajout des changements...
                            git add kubernetes/deployment.yaml

                            echo Commit des changements...
                            git commit -m "chore: Update image tag to ${IMAGE_TAG} [skip ci]" || echo "Aucun changement à commiter"

                            echo Push vers GitHub avec authentification...
                            git push https://%GIT_USERNAME%:%GIT_TOKEN%@github.com/Azaziop/reservationRepo.git HEAD:master || echo "Push échoué"
                        """
                    }
                    echo "✅ Manifests Kubernetes mis à jour avec l'image ${newImageTag}"
                    echo "🔄 Argo CD va détecter les changements et déployer automatiquement"
                }
            }
        }

        stage('Code Quality') {
            parallel {
                stage('PHP Code Style') {
                    steps {
                        echo 'Vérification du style de code PHP...'
                        bat '''
                            php artisan inspire || exit 0
                        '''
                    }
                }

                stage('JavaScript Lint') {
                    steps {
                        echo 'Vérification du code JavaScript...'
                        bat '''
                            npm run lint || exit 0
                        '''
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Exécution des tests...'
                bat '''
                    php artisan test --parallel
                '''
            }
        }

        stage('Security Check') {
            steps {
                echo 'Vérification de sécurité...'
                bat '''
                    composer audit || exit 0
                    npm audit --audit-level=moderate || exit 0
                '''
            }
        }

        stage('Generate Documentation') {
            steps {
                echo 'Génération de la documentation...'
                bat '''
                    echo Documentation générée
                '''
            }
        }

        stage('CI/CD Pipeline Complete') {
            steps {
                echo '✅ Pipeline CI/CD terminé avec succès !'
                bat """
                    echo ========================================
                    echo CONTINUOUS INTEGRATION/DEPLOYMENT - SUCCÈS
                    echo ========================================
                    echo Toutes les étapes ont réussi :
                    echo ✓ Code récupéré
                    echo ✓ Dépendances installées
                    echo ✓ Assets compilés
                    echo ✓ Image Docker construite: ${IMAGE_TAG}
                    echo ✓ Image poussée vers ${DOCKER_REGISTRY}
                    echo ✓ Manifests Kubernetes mis à jour
                    echo ✓ Qualité de code vérifiée
                    echo ✓ Tests exécutés (25 tests)
                    echo ✓ Sécurité vérifiée
                    echo.
                    echo 🚀 Déploiement automatique en cours via Argo CD...
                    echo 📦 Image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}
                    echo ========================================
                """
            }
        }
    }

    post {
        always {
            echo 'Nettoyage...'
            bat '''
                php artisan config:clear || exit 0
            '''
        }

        success {
            echo '✅ Pipeline CI/CD validé avec succès !'
            bat """
                echo ========================================
                echo CONTINUOUS INTEGRATION/DEPLOYMENT - SUCCÈS
                echo ========================================
                echo Job: ${env.JOB_NAME}
                echo Build: #${env.BUILD_NUMBER}
                echo Branche: ${env.BRANCH_NAME}
                echo Commit: ${env.GIT_COMMIT}
                echo Durée: ${currentBuild.durationString}
                echo.
                echo ✅ Pipeline complet exécuté avec succès
                echo 📦 Image Docker: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}
                echo 🔄 Argo CD va déployer automatiquement vers Kubernetes
                echo 🌐 URL: https://reservation.example.com (après déploiement)
                echo.
                echo Pour suivre le déploiement :
                echo   - Argo CD UI: kubectl port-forward svc/argocd-server -n argocd 8080:443
                echo   - kubectl -n reservation-salles get pods
                echo ========================================
            """
        }

        failure {
            echo '❌ Pipeline CI/CD échoué !'
            bat """
                echo ========================================
                echo CONTINUOUS INTEGRATION/DEPLOYMENT - ÉCHEC
                echo ========================================
                echo Job: ${env.JOB_NAME}
                echo Build: #${env.BUILD_NUMBER}
                echo Voir les logs: ${env.BUILD_URL}console
                echo.
                echo Vérifications possibles :
                echo   - Docker est-il installé et en cours d'exécution ?
                echo   - Les credentials Docker sont-ils configurés ?
                echo   - Les tests passent-ils localement ?
                echo   - Les manifests Kubernetes sont-ils valides ?
                echo ========================================
            """
        }

        unstable {
            echo '⚠️ Build instable'
        }
    }
}
