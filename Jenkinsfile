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

        // Force Docker to build for AMD64 so it runs on GKE (same as the backend pipeline)
        DOCKER_DEFAULT_PLATFORM = 'linux/amd64'
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
                echo "▶ Building Docker image ${IMAGE_NAME}:${BUILD_NUMBER} for AMD64..."
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
                    echo "✅ Pushed ${IMAGE_NAME}:${BUILD_NUMBER} to Docker Hub"
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker rmi ${IMAGE_NAME}:${BUILD_NUMBER} || true"
                sh "docker rmi ${IMAGE_NAME}:latest || true"
            }
        }

        // ── Trigger Argo CD (Update K8s Manifests) ─────────────────────────
        stage('Trigger Argo CD') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github', // Make sure this matches your Jenkins credential ID for GitHub
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )]) {
                    sh '''
                        # Cleanup any previous clone to avoid "already exists" errors
                        rm -rf k8s-repo
                        git clone https://github.com/amirchaaari/k8s-manifests.git k8s-repo
                        cd k8s-repo

                        # Update the frontend deployment.yaml with the new build tag
                        sed -i "s|image: amirchaari/wso2-notifier-frontend:.*|image: amirchaari/wso2-notifier-frontend:${BUILD_NUMBER}|g" releases/application/frontend-deployment.yaml
                        
                        git config user.email "jenkins@wso2-notifier.local"
                        git config user.name "Jenkins CI"
                        
                        git add releases/application/frontend-deployment.yaml
                        git commit -m "ci(frontend): deploy build #${BUILD_NUMBER}"
                        
                        git push https://${GIT_USER}:${GIT_PASS}@github.com/amirchaaari/k8s-manifests.git main
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            cleanWs() // Clean Jenkins workspace after every build
        }
    }
}