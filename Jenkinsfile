pipeline {
    agent any

    tools {
        nodejs 'nodejs'
        dockerTool 'docker'
    }

    environment {
        DOCKERHUB_USER = "amirchaari"
        IMAGE_NAME = "amirchaari/wso2-notifier-frontend"
        DOCKERHUB_CREDS = 'dockerhub'
    }

    stages {

        stage('Build') {
            steps {
                echo "▶ Using NodeJS tool..."
                sh 'node -v'
                sh 'npm -v'

                echo '▶ Installing dependencies...'
                sh 'npm ci'

                echo '▶ Building frontend...'
                sh 'npm run build'

                echo '✅ Build completed'
            }
        }

        stage('Docker Build') {
            steps {
                echo "▶ Building Docker image ${IMAGE_NAME}:${BUILD_NUMBER}"
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
                echo '✅ Docker image built'
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
                    sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker push ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker rmi ${IMAGE_NAME}:${BUILD_NUMBER} || true"
                sh "docker rmi ${IMAGE_NAME}:latest || true"
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
    }
}