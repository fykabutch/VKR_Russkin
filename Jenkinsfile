pipeline {
    agent any

    stages {
        stage('Hello') {
            steps {
                echo 'Hello jenkins'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'ls -l'
                sh 'docker compose build'
            }
        }

        stage('Start Docker Container') {
            steps {
                sh 'docker compose down --remove-orphans'
                sh 'docker compose up -d --remove-orphans'
                sh 'docker compose ps'
            }
        }

        stage('Configure MariaDB Access') {
            steps {
                sh '''
                    set +x
                    echo "Waiting for MariaDB..."
                    until docker exec vkr_russkin_mariadb mariadb-admin ping -h localhost -uvkr_russkin -pvkr_russkin_password --silent; do
                        sleep 2
                    done

                    if docker exec vkr_russkin_mariadb mariadb -uroot -ppassword -e "SELECT 1;" >/dev/null 2>&1; then
                        DB_ROOT_PASSWORD="password"
                    else
                        DB_ROOT_PASSWORD="vkr_russkin_root_password"
                    fi

                    docker exec vkr_russkin_mariadb mariadb -uroot -p"$DB_ROOT_PASSWORD" -e "
                        CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'password';
                        ALTER USER 'root'@'%' IDENTIFIED BY 'password';
                        ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
                        GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
                        CREATE USER IF NOT EXISTS 'vkr_russkin'@'%' IDENTIFIED BY 'vkr_russkin_password';
                        ALTER USER 'vkr_russkin'@'%' IDENTIFIED BY 'vkr_russkin_password';
                        GRANT ALL PRIVILEGES ON vkr_russkin.* TO 'vkr_russkin'@'%';
                        FLUSH PRIVILEGES;
                    "
                    echo "MariaDB access is configured."
                '''
            }
        }
    }
}
