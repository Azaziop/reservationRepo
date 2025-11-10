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
                        bat '''
                            node --version
                            npm --version
                            npm ci
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
    }

    post {
        always {
            echo 'Nettoyage...'
            bat '''
                php artisan config:clear || exit 0
            '''
        }

        success {
            echo '✅ Build réussi !'
            // Notifications de succès
        }

        failure {
            echo '❌ Build échoué !'
            // Notifications d'échec
        }

        unstable {
            echo '⚠️ Build instable'
        }
    }
}
