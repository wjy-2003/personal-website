#!/bin/bash
# AI Report Writer - 启动脚本
# 使用方法: ./run.sh
# 然后在浏览器打开 http://localhost:8888

cd "$(dirname "$0")"

# 激活虚拟环境
source .venv/bin/activate

# 清除代理环境变量（避免 httpx/requests 走代理）
unset ALL_PROXY HTTP_PROXY HTTPS_PROXY http_proxy https_proxy

echo "=========================================="
echo "  AI Report Writer Server"
echo "  http://localhost:8888"
echo "=========================================="
echo ""

# 启动服务
python3 start.py
