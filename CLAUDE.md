@AGENTS.md

# Conventions

Read `SPEC.md` first. Work one ticket at a time; finish with its check.

- TypeScript strict. Path alias `@/*` maps to `src/*`.
- All user-facing strings go in `src/lib/copy.ts`. Colours come from the CSS tokens in `src/app/globals.css`, never hard-coded.
- Shared UI lives in `src/components/ui`. Scene code lives in `src/components/scene` and must be dynamically imported with `ssr: false`. The scene never fetches data; it receives props.
- Validate every external input with zod (`src/lib/schema.ts`). Links `http(s)` only.
- Never expose `SARVAM_API_KEY` to the client. Never commit `.env*` (only `.env.example`).
- No runtime CDN requests. Fonts and assets are local.
- Commands: `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`.
- Use the Windows shell syntax appropriate to the tool in use (PowerShell or Bash).
- The Hackathoni pre-built-code rule is still unconfirmed. The user chose to proceed with T2 onwards anyway (20 Nov 2026). Keep a record of what was built before the event.
