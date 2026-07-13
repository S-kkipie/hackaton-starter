# create-skippie-hackaton

Scaffold the [Skippie hackathon starter](https://github.com/S-kkipie/hackaton-starter)
— Next 16 + Elysia + Better Auth + Drizzle/Postgres with a `Project` CRUD
reference domain (server-driven data-table + TanStack Form).

## Usage

```bash
npx create-skippie-hackaton my-app
# or
npm  create skippie-hackaton my-app
# or
pnpm create skippie-hackaton my-app
```

Then:

```bash
cd my-app
pnpm install
cp .env.example .env   # set DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
pnpm db:migrate
pnpm dev
```

`BETTER_AUTH_SECRET`: `openssl rand -base64 32`. `DATABASE_URL`: any Postgres
(Supabase, Neon, local).

## What it does

- Shallow-clones the template repo (`git clone --depth 1`).
- Strips the scaffolder + internal docs (`cli/`, `docs/superpowers/`); keeps
  `docs/code-review/` conventions.
- Renames the project in `package.json`.
- Re-initializes git with a fresh initial commit.

Requires `git` and Node ≥ 18. **Zero runtime dependencies** (instant `npx`).

## Publishing (maintainer)

```bash
cd cli/create-skippie-hackaton
npm login
npm publish --access public
```

The npm package name is `create-skippie-hackaton`, which is what enables
`npm create skippie-hackaton` / `npx create-skippie-hackaton`. Bump `version` in
`package.json` before each publish.
