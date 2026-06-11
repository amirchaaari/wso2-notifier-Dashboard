pipeline {
    agent any


    tools {
     
        dockerTool 'docker'

    }

    environment {
        DOCKERHUB_USER="amirchaari"

        // ── Change to your Docker Hub username ────────────────────────────────
        IMAGE_NAME      = "${DOCKERHUB_USER}/wso2-notifier-frontend"
        DOCKERHUB_CREDS = 'dockerhub'   // credential ID in Jenkins
    }

    stages {

        // ── 1. Install dependencies and build (the only "build" Jenkins does) ─
        stage('Build') {
            steps {
                echo '▶ Installing npm dependencies...'
                sh 'npm ci'
                echo '▶ Building React/Vite frontend...'
                sh 'npm run build'
                echo '✅ Build complete: dist/ folder ready'
            }
        }

        // ── 2. Build Docker image (just copies dist/, no Node.js inside) ──────
        stage('Docker Build') {
            steps {
                echo "▶ Building Docker image ${IMAGE_NAME}:${BUILD_NUMBER}..."
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
                echo '✅ Docker image built'
            }
        }

        // ── 3. Push to Docker Hub ─────────────────────────────────────────────
        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker push ${IMAGE_NAME}:latest"
                    echo "✅ Pushed ${IMAGE_NAME}:${BUILD_NUMBER} to Docker Hub"
                }
            }
        }

        // ── 4. Cleanup local images ───────────────────────────────────────────
        stage('Cleanup') {
            steps {
                sh "docker rmi ${IMAGE_NAME}:${BUILD_NUMBER} || true"
                sh "docker rmi ${IMAGE_NAME}:latest || true"
                echo '✅ Local Docker images cleaned up'
            }
        }
    }

    post {
        success {
            echo "✅ Frontend pipeline SUCCESS — Image: ${IMAGE_NAME}:${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Frontend pipeline FAILED at build #${BUILD_NUMBER}"
        }
        always {
            sh 'docker logout || true'
        }
    }
}
