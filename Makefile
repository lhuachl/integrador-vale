.PHONY: dev-api dev-ui dev build-api build-ui build lint-api lint-ui lint typecheck-api typecheck-ui typecheck clean

# ─── Dev ──────────────────────────────────────────────────────────────────────

dev-api:
	cd apps/api && bun run --watch src/index.ts

dev-ui:
	cd apps/UI && pnpm dev

dev: dev-api dev-ui

# ─── Build ─────────────────────────────────────────────────────────────────────

build-api:
	bun build apps/api/src/index.ts --outdir apps/api/dist

build-ui:
	cd apps/UI && pnpm build

build: build-api build-ui

# ─── Lint / Typecheck ─────────────────────────────────────────────────────────

lint-api:
	cd apps/api && bunx tsc --noEmit

lint-ui:
	cd apps/UI && pnpm exec tsc --noEmit

lint: lint-api lint-ui

typecheck: lint

# ─── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf apps/api/dist apps/UI/dist apps/api/node_modules apps/UI/node_modules
