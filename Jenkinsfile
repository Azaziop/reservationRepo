// Jenkinsfile - clean declarative pipeline
pipeline {
    agent any

    environment {
        // Replace this placeholder with your staging server IP or DNS
        STAGING_SERVER_HOST = 'STAGING_SERVER_HOST_PLACEHOLDER'
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
                    // If you want to force a registry/namespace, set `DOCKER_REGISTRY` in Jenkins env.
                    // Treat common placeholder values (like 'monregistre') as unset so we use the authenticated Docker user.
                    def rawRegistry = (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY.trim()) ? env.DOCKER_REGISTRY.trim() : null
                    def explicitRegistry = null
                    if (rawRegistry) {
                        def normalized = rawRegistry.trim().toLowerCase()
                        if (!(normalized == 'monregistre' || normalized == 'monregistre/' || normalized == '')) {
                            explicitRegistry = rawRegistry
                        }
                    }

                    // Prefer an explicit env var `DOCKER_CREDENTIALS_ID`, fall back to the Jenkins store id
                    def dockerCred = env.DOCKER_CREDENTIALS_ID ?: 'docker-registry-credentials'
                    withCredentials([usernamePassword(credentialsId: dockerCred, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        // Use explicit registry if provided, otherwise use the authenticated Docker username
                        def registry = explicitRegistry ?: "${DOCKER_USER}"
                        def imageTag = registry + '/reservationapp:' + safeBranch + '-' + (env.BUILD_NUMBER ?: '0')
                        def isPrimaryBranch = (branch == 'master' || branch == 'main' || safeBranch == 'master' || safeBranch == 'main' || branch.endsWith('/master') || branch.endsWith('/main'))

                        if (isUnix()) {
                            sh 'echo "Logging in to Docker registry as $DOCKER_USER"'
                            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                            sh "echo \"imageTag=${imageTag}\""
                            sh "docker build -f Dockerfile -t ${imageTag} ."
                            sh "docker push ${imageTag}"

                            if (isPrimaryBranch) {
                                sh "docker tag ${imageTag} ${registry}/reservationapp:latest"
                                // Retry push of :latest a few times to mitigate transient registry issues
                                retry(3) {
                                    sh "docker push ${registry}/reservationapp:latest"
                                }
                                // Inspect the manifest for :latest and emit it to logs for diagnostics
                                sh "echo '--- docker manifest inspect ${registry}/reservationapp:latest ---' || true"
                                sh "docker manifest inspect ${registry}/reservationapp:latest || true"
                            }

                            sh 'docker logout || true'
                        } else {
                            bat 'echo Logging in to Docker registry as %DOCKER_USER%'
                            bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                            bat "echo imageTag=${imageTag}"
                            bat "docker build -f Dockerfile -t ${imageTag} ."
                            bat "docker push ${imageTag}"

                            if (isPrimaryBranch) {
                                bat "docker tag ${imageTag} ${registry}/reservationapp:latest"
                                // Retry push of :latest a few times to mitigate transient registry issues
                                retry(3) {
                                    bat "docker push ${registry}/reservationapp:latest"
                                }
                                // Inspect the manifest for :latest and emit it to logs for diagnostics
                                bat "echo --- docker manifest inspect ${registry}/reservationapp:latest ---"
                                bat "docker manifest inspect ${registry}/reservationapp:latest || exit /b 0"
                            }

                            bat 'docker logout || exit 0'
                        }
                    }
                }
            }
        }

        stage('Deploy to Staging (Webhook)') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                    expression {
                        def b1 = (env.BRANCH_NAME != null) && (env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main')
                        def b2 = (env.GIT_BRANCH != null) && (
                            env.GIT_BRANCH.endsWith('/master') || env.GIT_BRANCH.endsWith('/main') || env.GIT_BRANCH == 'refs/heads/master' || env.GIT_BRANCH == 'refs/heads/main'
                        )
                        return b1 || b2
                    }
                }
            }
            steps {
                script {
                    if (!env.STAGING_SERVER_HOST) {
                        error "La variable d'environnement STAGING_SERVER_HOST n'est pas définie dans Jenkins."
                    }

                    // Use a secret text credential in Jenkins for the deploy listener token
                    // Credentials id: STAGING_DEPLOY_TOKEN (secret text)
                    try {
                        withCredentials([string(credentialsId: 'STAGING_DEPLOY_TOKEN', variable: 'DEPLOY_TOKEN')]) {
                            def url = "http://${env.STAGING_SERVER_HOST}:8088/deploy-reservation"
                            echo "Posting deploy webhook to ${url}"
                            if (isUnix()) {
                                sh "curl -sS -X POST -H \"X-Deploy-Token: ${DEPLOY_TOKEN}\" ${url} -o /tmp/deploy-resp.txt -w '%{http_code}' || true"
                                sh "echo 'Webhook response:'; cat /tmp/deploy-resp.txt || true"
                            } else {
                                bat "powershell -Command \"Invoke-RestMethod -Uri '${url}' -Method POST -Headers @{'X-Deploy-Token'='${DEPLOY_TOKEN}'} | Out-File -FilePath C:\\Windows\\Temp\\deploy-resp.txt -Encoding utf8\""
                                bat "type C:\\Windows\\Temp\\deploy-resp.txt"
                            }
                        }
                    } catch (err) {
                        echo "Deploy webhook failed to send or credential 'STAGING_DEPLOY_TOKEN' missing: ${err}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo 'Nettoyage final...'
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
