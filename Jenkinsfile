pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        BUILD_CONFIGURATION = 'Release'
        COMPOSE_PROJECT_NAME = 'vkr_russkin'
        APP_IMAGE_TAG = "${BUILD_NUMBER}"
        APP_PORT = '5454'
        DEPLOY_ENV_FILE = '/etc/vkr-russkin/deploy.env'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    set -eu
                    test -r "$DEPLOY_ENV_FILE" || {
                        echo "Deployment environment file is not readable: $DEPLOY_ENV_FILE"
                        exit 1
                    }
                    docker compose --env-file "$DEPLOY_ENV_FILE" config --quiet
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    set -eu
                    docker compose --env-file "$DEPLOY_ENV_FILE" pull db
                    docker compose --env-file "$DEPLOY_ENV_FILE" build --pull app
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -eu
                    docker compose --env-file "$DEPLOY_ENV_FILE" up -d --remove-orphans
                    docker compose --env-file "$DEPLOY_ENV_FILE" ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -eu

                    for container in vkr_russkin_mariadb vkr_russkin; do
                        echo "Waiting for $container health check..."
                        for attempt in $(seq 1 60); do
                            status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container" 2>/dev/null || true)"

                            if [ "$status" = "healthy" ]; then
                                echo "$container is healthy."
                                break
                            fi

                            if [ "$attempt" = "60" ]; then
                                echo "$container did not become healthy. Last status: $status"
                                docker logs --tail=120 "$container" || true
                                exit 1
                            fi

                            sleep 2
                        done
                    done

                    docker exec vkr_russkin curl --fail --silent --show-error "http://localhost:5454/health"
                    echo
                    echo "Application smoke test passed."
                '''
            }
        }
    }

    post {
        failure {
            script {
                if (env.WORKSPACE) {
                    sh 'docker compose --env-file "$DEPLOY_ENV_FILE" logs --tail=200 app db || true'
                } else {
                    echo 'Workspace is not available, skipping docker compose logs.'
                }
            }
        }
        always {
            script {
                if (env.WORKSPACE) {
                    sh 'docker compose --env-file "$DEPLOY_ENV_FILE" ps || true'
                } else {
                    echo 'Workspace is not available, skipping docker compose ps.'
                }
            }
        }
    }
}
