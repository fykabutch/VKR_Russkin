pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        BUILD_CONFIGURATION = 'Release'
        DOTNET_CLI_TELEMETRY_OPTOUT = '1'
        DOTNET_NOLOGO = '1'
        COMPOSE_PROJECT_NAME = 'vkr_russkin'
        APP_IMAGE_TAG = "${BUILD_NUMBER}"
        APP_PORT = '5454'
        MARIADB_DATABASE = 'vkr_russkin'
        MARIADB_USER = 'vkr_russkin'
        MARIADB_PORT = '5456'
        MARIADB_PASSWORD = 'vkr_russkin_password'
        MARIADB_ROOT_PASSWORD = 'vkr_russkin_root_password'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Restore') {
            steps {
                sh 'dotnet restore VKR_Russkin.sln'
            }
        }

        stage('Build') {
            steps {
                sh 'dotnet build VKR_Russkin.sln --configuration "$BUILD_CONFIGURATION" --no-restore'
            }
        }

        stage('Test') {
            steps {
                sh '''
                    set -eu
                    TEST_PROJECTS="$(find . -name '*Tests.csproj' -print)"

                    if [ -z "$TEST_PROJECTS" ]; then
                        echo "Test projects were not found. Add a *Tests.csproj project to enable automated tests."
                        exit 0
                    fi

                    for project in $TEST_PROJECTS; do
                        dotnet test "$project" \
                            --configuration "$BUILD_CONFIGURATION" \
                            --no-build \
                            --logger "trx;LogFileName=test-results.trx" \
                            --results-directory TestResults
                    done
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'TestResults/**/*.trx', allowEmptyArchive: true
                }
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    set +x
                    : "${MARIADB_PASSWORD:?MARIADB_PASSWORD is required}"
                    : "${MARIADB_ROOT_PASSWORD:?MARIADB_ROOT_PASSWORD is required}"
                    docker compose config --quiet
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    set +x
                    docker compose pull db
                    docker compose build --pull app
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set +x
                    docker compose up -d --remove-orphans
                    docker compose ps
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

                    curl --fail --silent --show-error "http://localhost:${APP_PORT}/health"
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
                    sh 'docker compose logs --tail=200 app db || true'
                } else {
                    echo 'Workspace is not available, skipping docker compose logs.'
                }
            }
        }
        always {
            script {
                if (env.WORKSPACE) {
                    sh 'docker compose ps || true'
                } else {
                    echo 'Workspace is not available, skipping docker compose ps.'
                }
            }
        }
    }
}
