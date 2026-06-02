#!/bin/bash
set -e

### EC2 bootstrap for remote build.
### Runs on first boot, sets up Node.js + git, clones repo, installs idle-shutdown timer.

NODE_VERSION="24.14.1"
REPO_URL="https://github.com/webiny/webiny-js.git"
BUILD_DIR="/opt/webiny-js"
CACHE_BUCKET="__CACHE_BUCKET__"
BRANCH="${branch:-next}"

echo "=== Installing Node.js ${NODE_VERSION} ==="
curl -sL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-arm64.tar.xz" \
    -o /tmp/node.tar.xz
tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
rm /tmp/node.tar.xz
node --version

echo "=== Enabling corepack ==="
corepack enable

echo "=== Installing git and build deps ==="
dnf install -y git python3 make gcc gcc-c++ jq 2>&1 | tail -3

echo "=== Cloning repo (depth 1, branch: ${BRANCH}) ==="
mkdir -p /opt
git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${BUILD_DIR}"

echo "=== Restoring caches from S3 ==="
if [ -n "${CACHE_BUCKET}" ]; then
    aws s3 cp "s3://${CACHE_BUCKET}/cache/node_modules.tar.gz" /tmp/node_modules.tar.gz 2>/dev/null && \
        tar -xzf /tmp/node_modules.tar.gz -C "${BUILD_DIR}" && \
        rm /tmp/node_modules.tar.gz && \
        echo "  node_modules cache restored" || true

    aws s3 cp "s3://${CACHE_BUCKET}/cache/build-cache.tar.gz" /tmp/build-cache.tar.gz 2>/dev/null && \
        tar -xzf /tmp/build-cache.tar.gz -C "${BUILD_DIR}" && \
        rm /tmp/build-cache.tar.gz && \
        echo "  build cache restored" || true
fi

echo "=== Initial yarn install ==="
cd "${BUILD_DIR}"
HOME=/tmp node .yarn/releases/yarn-4.14.1.cjs install

echo "=== Setting up idle-shutdown (10 min) ==="
cat > /usr/local/bin/idle-shutdown.sh << 'IDLE_EOF'
#!/bin/bash
LAST=$(stat -c %Y /tmp/last-build-activity 2>/dev/null || echo 0)
NOW=$(date +%s)
if [ $((NOW - LAST)) -gt 600 ]; then
    TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
    INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/instance-id)
    aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" \
        --region "$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/placement/region)"
fi
IDLE_EOF
chmod +x /usr/local/bin/idle-shutdown.sh

echo "* * * * * /usr/local/bin/idle-shutdown.sh" | crontab -
date > /tmp/last-build-activity
echo "=== Bootstrap complete ==="
