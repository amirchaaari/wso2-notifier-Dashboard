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

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'docker login -u $DOCKER_USER -p $DOCKER_PASS'
                    // GKE nodes are linux/amd64. Build for that platform explicitly so the
                    // image runs on the cluster even when the Jenkins agent is arm64.
                    sh 'docker buildx create --use --name amd64builder || docker buildx use amd64builder'
                    echo "▶ Building & pushing ${IMAGE_NAME}:${BUILD_NUMBER} (linux/amd64)"
                    sh "docker buildx build --platform linux/amd64 -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest --push ."
                    echo '✅ Docker image built & pushed'
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