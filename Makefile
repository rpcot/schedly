.PHONY: start stop restart

start:
	docker compose build
	docker compose up -d

stop:
	docker compose down --timeout 2

restart: stop start

default: restart