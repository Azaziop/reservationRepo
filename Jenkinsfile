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
        LIQUIBASE_VERSION = '4.30.0'

        // --- NOUVELLE CONFIGURATION DOCKER & ARGO CD ---
        DOCKER_REGISTRY = 'docker.io/votre_compte' // REMPLACER : Votre Docker Hub ou Registry privé
        DOCKER_IMAGE_NAME = 'reservation-app'
        GITOPS_REPO_URL = 'git@github.com:votre_organisation/reservation-manifests.git' // REMPLACER : URL du dépôt GitOps (Manifestes K8s)
        GITOPS_CREDENTIAL_ID = 'gitops-ssh-key' // REMPLACER : ID de vos identifiants Git dans Jenkins pour pousser sur le repo GitOps
        DOCKER_CREDENTIAL_ID = 'docker-hub-credentials' // REMPLACER : ID de vos identifiants Docker Hub dans Jenkins
        K8S_MANIFEST_PATH = 'helm/values.yaml' // REMPLACER : Chemin vers le fichier qui contient la balise d'image (ex: values.yaml)
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Récupération du code source...'
                checkout scm
                // Générer une balise unique basée sur le hash de commit pour l'image Docker
                script {
                    env.IMAGE_TAG = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                    echo "Image tag sera: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Install Dependencies') {
             // ... étapes existantes ...
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
                bat 'npx vite build'
            }
        }

        stage('Code Quality') {
            parallel {
                stage('PHP Code Style') {
                    steps {
                        echo 'Vérification du style de code PHP...'
                        bat 'php artisan inspire || exit 0'
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
                bat 'php artisan test --parallel'
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

        // ===========================================
        // ======== NOUVELLES ÉTAPES CI/CD ========
        // ===========================================

        stage('Build & Push Docker Image') {
            steps {
                echo "Construction de l'image Docker: ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}:${env.IMAGE_TAG}"

                // Utilisation des identifiants Jenkins pour se connecter au Docker Registry
                withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIAL_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    // 1. Connexion au Registry
                    sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD} ${DOCKER_REGISTRY}"

                    // 2. Build de l'image (assurez-vous d'avoir un Dockerfile à la racine)
                    sh "docker build -t ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}:${env.IMAGE_TAG} ."

                    // 3. Push de l'image
                    sh "docker push ${env.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_NAME}:${env.IMAGE_TAG}"
                }
                echo "✅ Image Docker poussée avec succès."
            }
        }

        stage('GitOps Trigger (CD)') {
            steps {
                echo "Déclenchement Argo CD via GitOps..."

                // Le déploiement est déclenché par une mise à jour du dépôt GitOps
                withCredentials([sshUserPrivateKey(credentialsId: env.GITOPS_CREDENTIAL_ID, keyFileVariable: 'GITOPS_KEY')]) {
                    sh """
                        # Configurer Git
                        git config --global user.email "jenkins@ci.com"
                        git config --global user.name "Jenkins CI/CD Pipeline"

                        # 1. Cloner le dépôt de manifestes K8s (Repo GitOps)
                        git clone ${env.GITOPS_REPO_URL} gitops-repo
                        cd gitops-repo

                        # 2. Mise à jour du tag de l'image dans le manifeste (ex: values.yaml)
                        # NOTE: Vous devez installer 'yq' sur l'agent ou utiliser un conteneur dédié.
                        # Cette commande suppose que vous utilisez Helm/yq pour modifier le tag 'image.tag'
                        echo "Mise à jour du fichier : ${env.K8S_MANIFEST_PATH} avec la balise ${env.IMAGE_TAG}"
                        # REMPLACER la commande 'yq' si vous utilisez Kustomize ou un autre outil.
                        # Met à jour plusieurs chemins possibles : .image.tag, .image.php.tag et .image.nginx.tag
                        # Utilise la syntaxe 'strenv' pour injecter la variable d'environnement IMAGE_TAG
                        yq e '.image.php.tag = strenv(IMAGE_TAG) | .image.nginx.tag = strenv(IMAGE_TAG) | .image.tag = strenv(IMAGE_TAG)' -i ${env.K8S_MANIFEST_PATH}

                        # 3. Commiter et Pousser (déclenche Argo CD)
                        git add ${env.K8S_MANIFEST_PATH}
                        git commit -m "feat(cd): Mise à jour de l'image ${env.DOCKER_IMAGE_NAME} vers ${env.IMAGE_TAG} [skip ci]"
                        git push origin HEAD
                        echo "✅ Changement poussé vers le dépôt GitOps. Argo CD va maintenant synchroniser."
                    """
                }
            }
        }

        stage('CD Pipeline Complete') {
            steps {
                echo '✅ Pipeline CI/CD terminé avec succès !'
                sh '''
                    echo ========================================
                    echo DEPLOIEMENT EN COURS (VIA ARGO CD)
                    echo ========================================
                    echo ✓ Image Docker publiée
                    echo ✓ Manifeste GitOps mis à jour
                    echo Le déploiement est maintenant géré par Argo CD.
                    echo ========================================
                '''
            }
        }
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
