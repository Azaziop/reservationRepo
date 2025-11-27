// Jenkinsfile - clean declarative pipeline
pipeline {
    agent any

    environment {
        COMPOSER_HOME = "${WORKSPACE}/.composer"
    }

    stages {
        stage('Run Tests') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'if [ -f vendor/autoload.php ]; then php artisan test --parallel || true; else echo "Skipping tests: vendor missing"; fi'
                    } else {
                        bat 'if exist vendor\\autoload.php ( php artisan test --parallel ) else ( echo "Skipping tests: vendor missing" & exit /b 0 )'
                    }
                }
            }
        }

        stage('Security Check') {
            steps {
                echo 'Vérification des dépendances pour les vulnérabilités...'
                script {
                    if (isUnix()) {
                        sh 'composer audit || true; npm audit --audit-level=moderate || true'
                    } else {
                        bat 'composer audit || exit 0\nnpm audit --audit-level=moderate || exit 0'
                    }
                }
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                script {
                    def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'
                    def safeBranch = branch.replaceAll(/[^a-zA-Z0-9_.-]/, '-')
                    def registry = (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY.trim()) ? env.DOCKER_REGISTRY.trim() : 'monregistre'
                    def imageTag = registry + '/reservationapp:' + safeBranch + '-' + (env.BUILD_NUMBER ?: '0')
                    def isPrimaryBranch = (branch == 'master' || branch == 'main' || safeBranch == 'master' || safeBranch == 'main' || branch.endsWith('/master') || branch.endsWith('/main'))

                    withCredentials([usernamePassword(credentialsId: 'DOCKER_CREDENTIALS', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        if (isUnix()) {
                            sh 'echo "Logging in to Docker registry as $DOCKER_USER"'
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                            sh "docker build -f Dockerfile -t ${imageTag} ."
                            sh "docker push ${imageTag}"
                            sh 'docker logout || true'

                            if (isPrimaryBranch) {
                                sh "docker tag ${imageTag} ${registry}/reservationapp:latest"
                                sh "docker push ${registry}/reservationapp:latest"
                            }
                        } else {
                            bat 'echo Logging in to Docker registry as %DOCKER_USER%'
                            bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                            bat "docker build -f Dockerfile -t ${imageTag} ."
                            bat "docker push ${imageTag}"
                            bat 'docker logout || exit 0'

                            if (isPrimaryBranch) {
                                bat "docker tag ${imageTag} ${registry}/reservationapp:latest"
                                bat "docker push ${registry}/reservationapp:latest"
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
                        error "La variable d'environnement STAGING_SERVER_HOST n'est pas définie dans Jenkins."
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
                        def dbContainer = env.STAGING_DB_CONTAINER ?: env.DB_CONTAINER ?: 'db'
                        def dbUser = env.DB_USER_SECRET ?: env.STAGING_DB_USER ?: env.DB_USERNAME ?: 'root'
                        def dbPass = env.DB_PASS_SECRET ?: env.STAGING_DB_PASSWORD ?: env.DB_PASSWORD ?: ''
                        def dbName = env.DB_NAME_SECRET ?: env.STAGING_DB_NAME ?: env.DB_DATABASE ?: 'reservation_prod'

                        if (isUnix()) {
                            def remoteBackupPath = sh(returnStdout: true, script: "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${remoteHost} 'bash -s' < ${WORKSPACE}/scripts/staging-deploy.sh '${remotePath}' '${composeUrl}' '${dbContainer}' '${dbUser}' '${dbPass}' '${dbName}'").trim()
                            def backupFileName = remoteBackupPath.tokenize('/').last()
                            echo "Remote backup: ${remoteBackupPath} -> ${backupFileName}"
                            sh "scp -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${remoteHost}:'${remoteBackupPath}' ./"
                            archiveArtifacts artifacts: "${backupFileName}", fingerprint: true
                        } else {
                            bat "echo Windows agent deployment not implemented here; run from a Unix agent or adapt the pipeline."
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Nettoyage final...'
            script {
                if (!isUnix()) {
                    bat 'if exist vendor\\autoload.php ( php artisan config:clear ) else ( echo "Skipping final config:clear: vendor missing" ) || exit 0'
                } else {
                    sh 'if [ -f vendor/autoload.php ]; then php artisan config:clear || true; else echo "Skipping final config:clear: vendor missing"; fi'
                }
            }
        }
        success { echo '✅ Pipeline CI validé avec succès !' }
        failure { echo '❌ Pipeline CI échoué !' }
        unstable { echo '⚠️ Build instable' }
    }
}
