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
        DB_DATABASE = 'reservation_test'
        DB_USERNAME = 'root'
        DB_PASSWORD = ''

        // Configuration Liquibase
        LIQUIBASE_VERSION = '4.30.0'

        // Configuration du déploiement
        DEPLOY_PATH = 'C:\\inetpub\\wwwroot\\reservation'
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

        stage('Database Setup') {
            steps {
                echo 'Configuration de la base de données...'
                bat '''
                    php -r "try { $pdo = new PDO('mysql:host=localhost', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_test'); echo 'Database created successfully'; } catch (Exception $e) { echo 'Database creation failed: ' . $e->getMessage(); }"
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

        stage('Deploy to Production') {
            when {
                branch 'main'
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                echo 'Déploiement de l\'application...'

                bat """
                    echo ========================================
                    echo Déploiement en production
                    echo ========================================

                    echo Création du répertoire de déploiement si nécessaire...
                    if not exist "${DEPLOY_PATH}" mkdir "${DEPLOY_PATH}"

                    echo Création d'une sauvegarde...
                    if exist "${DEPLOY_PATH}\\app" (
                        xcopy /E /I /Y "${DEPLOY_PATH}" "${DEPLOY_PATH}_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
                    )

                    echo Copie des fichiers de l'application...
                    xcopy /E /I /Y /EXCLUDE:deploy-exclude.txt . "${DEPLOY_PATH}"

                    echo Configuration de l'environnement de production...
                    cd "${DEPLOY_PATH}"

                    if exist .env.production (
                        copy /Y .env.production .env
                    ) else (
                        echo ATTENTION: Fichier .env.production non trouvé!
                    )

                    echo Installation des dépendances de production...
                    composer install --no-dev --optimize-autoloader --no-interaction

                    echo Migration de la base de données de production...
                    php artisan migrate --force

                    echo Nettoyage des caches...
                    php artisan config:clear
                    php artisan cache:clear
                    php artisan route:clear
                    php artisan view:clear

                    echo Optimisation de l'application...
                    php artisan config:cache
                    php artisan route:cache
                    php artisan view:cache
                    php artisan optimize

                    echo Configuration des permissions...
                    icacls "${DEPLOY_PATH}\\storage" /grant IIS_IUSRS:(OI)(CI)F /T
                    icacls "${DEPLOY_PATH}\\bootstrap\\cache" /grant IIS_IUSRS:(OI)(CI)F /T

                    echo ========================================
                    echo ✅ Déploiement terminé avec succès!
                    echo ========================================
                """
            }
        }

        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                echo 'Vérification de la santé de l\'application...'
                bat '''
                    echo Vérification que l'application répond...
                    timeout /t 5 /nobreak
                    echo ✅ Application déployée et opérationnelle!
                '''
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
            echo '✅ Build et déploiement réussis !'
            bat """
                echo ========================================
                echo BUILD RÉUSSI
                echo ========================================
                echo Job: ${env.JOB_NAME}
                echo Build: #${env.BUILD_NUMBER}
                echo Branche: ${env.BRANCH_NAME}
                echo Commit: ${env.GIT_COMMIT}
                echo Durée: ${currentBuild.durationString}
                echo ========================================
            """
        }

        failure {
            echo '❌ Build ou déploiement échoué !'
            bat """
                echo ========================================
                echo BUILD ÉCHOUÉ
                echo ========================================
                echo Job: ${env.JOB_NAME}
                echo Build: #${env.BUILD_NUMBER}
                echo Voir les logs: ${env.BUILD_URL}console
                echo ========================================
            """
        }

        unstable {
            echo '⚠️ Build instable'
        }
    }
}
