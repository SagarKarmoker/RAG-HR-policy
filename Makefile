.ONESHELL:

.PHONY: dev backend frontend

dev:
	trap 'kill $$backend_pid $$frontend_pid 2>/dev/null || true' INT TERM EXIT
	(cd backend && uv run fastapi dev src/main.py) & backend_pid=$$!
	(cd frontend && pnpm dev) & frontend_pid=$$!
	wait $$backend_pid $$frontend_pid

backend:
	cd backend && uv run fastapi dev src/main.py

frontend:
	cd frontend && pnpm dev
