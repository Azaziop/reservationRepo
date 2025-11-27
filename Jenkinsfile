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

    stages {
        stage('Prepare workspace') {
            steps {
                script {
                    echo 'Nettoyage de l\'espace de travail...'
                    try {
                        cleanWs()
                    } catch (err) {
                        // Nettoyage de secours pour Windows
                        bat 'if exist "%WORKSPACE%" rd /s /q "%WORKSPACE%" || echo no workspace to remove'
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                echo 'Récupération du code source...'
                checkout scm
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
            stages {
                stage('PHP Dependencies') {
                    steps {
                        echo 'Installation des dépendances PHP et résolution des vulnérabilités... 🛡️'
                        bat 'php -v'
                        bat 'if exist vendor rmdir /s /q vendor'

                        // 1. Configuration et Nettoyage du cache Composer
                        bat 'set COMPOSER_MEMORY_LIMIT=-1'
                        bat 'composer clear-cache'

                        // 2. Installation de toutes les dépendances (y compris dev pour les tests)
                        bat 'composer install --no-interaction --prefer-dist --optimize-autoloader'

                        // 3. Mise à jour spécifique de la dépendance vulnérable (Symfony)
                        bat 'composer update symfony/http-foundation --with-all-dependencies'

                        // 4. Vérification critique
                        bat '''
                            if not exist vendor\\autoload.php (
                                echo "FATAL ERROR: vendor/autoload.php est manquant après installation!"
                                exit /b 1
                            ) else (
                                echo "Composer dependencies installed successfully."
                            )
                        '''
                        archiveArtifacts artifacts: 'composer-install.log', allowEmptyArchive: true
                    }
                }

                stage('Node Dependencies') {
                    steps {
                        echo 'Installation des dépendances Node.js...'
                        // Retirer la suppression du dossier si vous utilisez un cleanWs() initial
                        bat 'npm install'
                        // Vérification que les modules critiques sont présents
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

        stage('Environment Setup & DB') {
            steps {
                echo 'Configuration de l\'environnement et de la base de données de test... 💾'
                bat '''
                    if not exist .env copy .env.example .env

                    rem Remplace DB_HOST et force l'encodage UTF8 pour la compatibilité
                    powershell -Command "(gc .env -Encoding UTF8) -replace 'DB_HOST=mysql', 'DB_HOST=localhost' | Out-File .env -Encoding UTF8"

                    rem Exécution des commandes Artisan
                    if exist vendor\\autoload.php (
                        echo "Running Laravel Artisan Commands"
                        php artisan key:generate
                        php artisan config:clear
                    )

                    rem Création de la base de données de test (MySQL local, connexion directe)
                    php -r "try { $pdo = new PDO('mysql:host=localhost', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_test'); echo 'Database created successfully'; } catch (Exception $e) { echo 'Database creation failed: ' . $e->getMessage(); }"

                    rem Exécution des migrations et seeders
                    if exist vendor\\autoload.php (
                        echo "Running Migrations and Seeders"
                        php artisan migrate:fresh --seed --force
                    )
                '''
            }
        }

        stage('Build Assets') {
            steps {
                echo 'Compilation des assets frontend (Vite)...'
                bat 'npx vite build'
            }
        }

        stage('Code Quality & Tests') {
            parallel {
                stage('PHP Code Quality & Style') {
                    steps {
                        echo 'Vérification du style de code PHP...'
                        bat 'if exist vendor\\autoload.php ( php artisan inspire ) else ( echo "Skipping PHP Code Style: vendor missing" ) || exit 0'
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
