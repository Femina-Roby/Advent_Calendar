# SPEC: Kettuvallam Advent

Full plan: `C:\Users\Femina\.claude\plans\project-planning-brief-advent-rustling-treasure.md`. This file is the short version for build sessions.

## Product
A web app with two halves. **Premade calendar:** a Kerala houseboat in 3D with 24 gifts spread around the hull, freezing into winter as doors open. **Maker:** a signed-in sender fills 24 doors (Sarvam drafts them), then shares an unguessable link. The recipient needs no account.

## Hard rules
- No date logic anywhere. Doors open strictly 1 to 24, at any pace. Out-of-order is refused gently (wobble + toast, never red).
- Recipient progress is one integer in `localStorage` key `adv:<slug>`. Never sent to the server. The sender cannot see it.
- Christmas look only. Occasion text only feeds the Sarvam prompt.
- Free tiers only. Desktop first, but every checkpoint is smoke-tested on a phone.
- The 3D scene is the only recipient view. A device with no WebGL gets a clear message (there is no list view).

## Stack
Next.js (App Router, TS) on Vercel Hobby, Supabase (Google auth, Postgres, Storage), react-three-fiber + drei, zod, Sarvam `sarvam-105b` via server route. Fonts are local in `src/fonts`. Read `node_modules/next/dist/docs/` before using Next APIs (Next 16, see AGENTS.md).

## Routes
`/` landing, `/kit` style kit, `/c/[slug]` recipient, `/c/premade` (bundled fixture, no DB), `/make` dashboard, `/make/[id]` editor, `/api/draft`.

## Data model
`calendars`: id, slug (unique, nanoid 14+), owner_id (null for premade), title, recipient_name, closing_note, relationship, about, occasion (default christmas), theme, language (default en), published, created_at.
`doors`: calendar_id, number 1..24, body, link_url (http/https only), photo_path, source (`sarvam`|`template`|`manual`). PK (calendar_id, number). No `order` column.
RLS: owner full access; anon has no direct select; public read only through `get_calendar(slug)` (security definer, published only). Storage bucket `door-photos`, random paths, owner-only write.

## Contracts (write first)
1. `Calendar`/`Door` types + zod schemas (`src/lib/schema.ts`), shared by forms, Sarvam validation, fixtures.
2. `sceneParams(progress)` pure function, keyframes at 0, 6, 12, 18, 24 (water colour, fog, snow count, ice, trees, lanterns).
3. `GIFT_ANCHORS`: 24 positions around the hull.
4. `useProgress(slug)`: clamp 0..24, try/catch around storage.
5. `draftCalendar(input)`: Sarvam in two parallel calls of 12 doors, zod validate, retry once, fall back to templates, tag `source`.

## Hardening (required)
- `/api/draft` requires a signed-in user and a per-user rate limit.
- Links accept `http(s)` only. Photos: image types only, resized client-side to 1280px webp, under 300KB.
- Secrets only in env (`SARVAM_API_KEY` server-only). `.env*` never committed.
- Footer credits any CC-BY model or font. README explains how it was built.

## Tickets (one per session, each ends with its check and a redeploy)
| # | Ticket | Check |
|---|---|---|
| T1 | Scaffold + `/kit` style page | Deploys, kit looks right on phone |
| T2 | Types, zod schemas, fixtures | Fixture validates |
| T3 | `get_calendar` RPC, RLS, schema.sql | Anon call returns published calendar only |
| T4 | `useProgress` + opener + out-of-order refusal | Door 5 before 4 refused, reload keeps progress |
| T5 | `sceneParams` + unit tests | Values at 0, 6, 12, 18, 24 match table |
| T6 | Boat (model or primitives) + anchors + camera | Rotating shows all 24 markers |
| T7 | Water, fog, snow, ice, trees, lanterns from params | Slider 0 to 24 looks right |
| T8 | Wire opener to scene, finale | Opening doors freezes the scene |
| T9 | Google sign-in + dashboard | Sign in works on prod URL |
| T10 | Maker form, save, publish, share link | Link opens in a private window |
| T11 | `/api/draft` + template fallback | Airplane mode still completes |
| T12 | Photo upload | Photo shows in door |
| T13 | Polish + phone pass | Smooth on a mid-range phone |

## Cut line (first dropped first)
TTS clips, translation, per-door regenerate, photo upload, extra freeze polish, quality tier.
**Never cut:** premade link, in-order opener, freeze progression, Sarvam draft-edit-share, Google sign-in, live deploy.

## Open items
- Hackathoni rule on pre-built code (unconfirmed, check with organisers). Until then only T1 is built.
- 3D model gate (45 min): hull from 3D Warehouse "Kerala House Boat", Sketchfab "Vallam" (CC-BY) or OpenGameArt "Fishing Boat" (CC0); roof, snow, lanterns from primitives. Fall back to all primitives.
- Verify Sarvam model id, endpoint, auth header and pricing on the dashboard and docs MCP before T11.
