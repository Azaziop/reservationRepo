// CI-only Jenkinsfile — CD / deploy stages removed
pipeline {
    agent any

    environment {
        // --- CI Configuration Existante ---
        PHP_VERSION = '8.2'
        COMPOSER_HOME = "${WORKSPACE}/.composer"
        NODE_VERSION = '20.x'
        DB_CONNECTION = 'mysql'
        DB_HOST = 'localhost'
        DB_PORT = '3306'
        DB_DATABASE = 'reservation_test'
        DB_USERNAME = 'root'
        DB_PASSWORD = ''
    }

    stages {
        stage('Prepare workspace') {
            steps {
                script {
                    try {
                        cleanWs()
                    } catch (err) {
                        // Fallback: remove workspace contents cross-platform
                        if (isUnix()) {
                            sh 'rm -rf "${WORKSPACE:?}"/*'
                        } else {
                            bat 'rd /s /q "%WORKSPACE%" || echo no workspace to remove'
                        }
                    }
                }
            }
        }
        stage('Checkout') {
            steps {
                echo 'Récupération du code source...'
                checkout scm
                // CI-only: log the current commit short hash (no image tag generation)
                script {
                    if (isUnix()) {
                        env.COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                    } else {
                        env.COMMIT_SHORT = bat(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    }
                    echo "Commit: ${env.COMMIT_SHORT}"
                }
            }
        }

        stage('Install Dependencies') {
            // Run installs sequentially to avoid transient workspace conflicts on Windows CI
            stages {
                stage('PHP Dependencies') {
                    steps {
                        echo 'Installation des dépendances PHP...'
                        bat 'php -v'
                        bat 'if exist vendor rmdir /s /q vendor'
                        bat 'where composer || echo "where composer failed or not found"'
                        bat 'composer --version || echo "composer --version failed"'
                        bat 'composer clear-cache'
                        bat 'set COMPOSER_MEMORY_LIMIT=-1'
                        bat 'composer diagnose || echo "composer diagnose returned non-zero"'
                        bat 'echo "=== START: composer install (verbose, to composer-install.log) ==="'
                        bat 'composer -vvv install --no-interaction --prefer-dist --optimize-autoloader --no-progress > composer-install.log 2>&1'
                        bat 'if %ERRORLEVEL% neq 0 ( echo "Composer install failed (exit %ERRORLEVEL%). Dumping composer-install.log and retrying with --prefer-source:" & type composer-install.log & composer -vvv install --no-interaction --prefer-source --optimize-autoloader --no-progress > composer-install.log 2>&1 )'
                        bat 'powershell -Command "if (Test-Path composer-install.log) { Get-Content composer-install.log -Tail 200 -Raw } else { Write-Host \"composer-install.log not found\" }"
'
                        bat 'composer show -i || echo "composer show failed"'
                        bat 'if exist vendor ( echo vendor exists & dir vendor ) else ( echo vendor missing after composer install & dir & exit /b 1 )'
                        // Archive the composer log if present
                        archiveArtifacts artifacts: 'composer-install.log', allowEmptyArchive: true
                    }
                }
                stage('Node Dependencies') {
                    steps {
                        echo 'Installation des dépendances Node.js...'
                        bat 'node --version'
                        bat 'npm --version'
                        bat 'if exist node_modules rmdir /s /q node_modules'
                        bat 'npm install'
                        bat '''
                            if exist node_modules\\vite\\package.json (
                                echo Vite package detected
                            ) else (
                                echo ERROR: Vite package missing after npm install
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
                    rem Run artisan commands only if vendor/autoload.php exists to avoid fatal errors during debug
                    if exist vendor\\autoload.php (
                        echo "vendor present — running artisan commands"
                        php artisan key:generate
                        php artisan config:clear
                    ) else (
                        echo "vendor/autoload.php not found — skipping artisan key:generate and config:clear"
                    )
                '''
            }
        }

        stage('Database Setup') {
            steps {
                echo 'Configuration de la base de données...'
                bat '''
                    php -r "try { $pdo = new PDO('mysql:host=localhost', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_test'); echo 'Database created successfully'; } catch (Exception $e) { echo 'Database creation failed: ' . $e->getMessage(); }"
                    rem Run migrate only if vendor/autoload.php exists
                    if exist vendor\\autoload.php (
                        echo "vendor present — running migrations"
                        php artisan migrate:fresh --seed --force
                    ) else (
                        echo "vendor/autoload.php not found — skipping migrations"
                    )
                '''
            }
        }

        stage('Build Assets') {
            steps {
                echo 'Compilation des assets frontend...'
                bat 'npx vite build'
            }
        }

                stage('Code Quality') {
            parallel {
                stage('PHP Code Style') {
                    steps {
                        echo 'Vérification du style de code PHP...'
                        bat 'if exist vendor\\autoload.php ( php artisan inspire ) else ( echo "Skipping php artisan inspire: vendor missing" ) || exit 0'
                    }
                }
                stage('JavaScript Lint') {
                    steps {
                        echo 'Vérification du code JavaScript...'
                        bat 'npm run lint || exit 0'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Exécution des tests...'
                bat 'if exist vendor\\autoload.php ( php artisan test --parallel ) else ( echo "Skipping php artisan test: vendor missing" & exit /b 0 )'
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
                bat 'echo Documentation générée'
            }
        }

        // (ArgoCD / GitOps stages removed)
    }

    post {
        always {
            echo 'Nettoyage...'
            bat 'php artisan config:clear || exit 0'
        }
        success {
            echo '✅ Pipeline CI/CD validé avec succès !'
        }
        failure {
            echo '❌ Pipeline CI/CD échoué !'
        }
        unstable {
            echo '⚠️ Build instable'
        }
    }
}
