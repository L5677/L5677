## MySQL（docker-compose）

目录：`/mysql`

1) 启动

```bash
cd mysql
docker compose up -d
```

2) 默认配置
- 端口：`3307 -> 3306`
- 数据库：`attendance_app`
- 用户：`attendance`
- 密码：`attendance123`

3) FastAPI 连接
`backend-python/main.py` 默认读取环境变量：
- `DB_HOST` 建议：`127.0.0.1`（与 FastAPI 同机运行时）
- `DB_PORT`：`3307`
- 其它见 MySQL 默认配置

