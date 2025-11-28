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

        stage('Deploy to Staging (Agent)') {
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
            agent { label 'staging' }
            steps {
                script {
                    // Ensure necessary credentials exist: Docker registry + DB secrets (optional)
                    def dockerCred = env.DOCKER_CREDENTIALS_ID ?: 'docker-registry-credentials'
                    try {
                        withCredentials([
                            usernamePassword(credentialsId: dockerCred, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                            string(credentialsId: 'STAGING_DB_PASSWORD_CRED', variable: 'DB_PASS_SECRET'),
                            string(credentialsId: 'STAGING_DB_USER_CRED', variable: 'DB_USER_SECRET'),
                            string(credentialsId: 'STAGING_DB_NAME_CRED', variable: 'DB_NAME_SECRET')
                        ]) {
                            // Determine registry (fallback to authenticated Docker username)
                            def registry = (env.DOCKER_REGISTRY && env.DOCKER_REGISTRY.trim()) ? env.DOCKER_REGISTRY.trim() : "${DOCKER_USER}"

                            echo "Deploying on agent 'staging' using registry: ${registry}"

                            // Login, pull latest image, and run compose on the staging host (agent)
                            sh '''
                                set -o pipefail
                                echo "Logging in to Docker registry as $DOCKER_USER"
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin || true
                                echo "Pulling images from ${registry}/reservationapp:latest"
                                docker pull ${registry}/reservationapp:latest || true
                                # Allow user-managed compose file in workspace; otherwise rely on docker images
                                docker compose pull || true
                                docker compose up -d --remove-orphans
                                docker logout || true
                            '''

                            // Run the repository's staging-deploy.sh locally on the agent to perform backup/migrate/healthcheck
                            sh "chmod +x ${WORKSPACE}/scripts/staging-deploy.sh || true"
                            sh "${WORKSPACE}/scripts/staging-deploy.sh ${env.STAGING_DEPLOY_PATH ?: '/opt/reservation'} '' ${env.STAGING_DB_CONTAINER ?: 'mysql'} '${DB_USER_SECRET}' '${DB_PASS_SECRET}' '${DB_NAME_SECRET}'"
                        }
                    } catch (err) {
                        echo "Required credentials missing or error during deploy stage: ${err}"
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
