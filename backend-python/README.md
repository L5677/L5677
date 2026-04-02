## FastAPI 后端（MySQL）

运行方式（建议使用虚拟环境）：

1. 创建 venv 并安装依赖
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -r requirements.txt`

2. 配置环境变量
   - `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`
   - `JWT_SECRET_KEY`（可选，默认开发值）

3. 启动
   - `DB_HOST=127.0.0.1 DB_PORT=3307 uvicorn main:app --host 0.0.0.0 --port 8001`

演示账号（首次启动会自动 seed，若数据库为空）：
- `admin / admin123`（管理员）
- `user / user123`（员工）

