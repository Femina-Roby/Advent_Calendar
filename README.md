# Kettuvallam Advent

**Live site: https://createadventcalendar.vercel.app/**

An advent calendar set on a Kerala houseboat that freezes into winter as you open its 24 doors. Anyone can open the premade calendar from a link. Anyone can also make one for someone: fill the 24 objects with a message, a link and a photo, and share a single link. The person who receives it needs no account.

Built for Hackathoni (Devin and TinkerHub, Alappuzha, 21 to 22 November 2026).

## Run locally

```
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Commands: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`.

## Status

See `SPEC.md` for the plan and `CONTENT.md` for what the premade calendar still needs from its author.

## Making a calendar, and photos

`/make` lets a sender fill all 24 objects (a message, an optional link, an optional photo from their device) and
produces a share link. The whole calendar travels inside that link, so the recipient needs no account.

Photos are shrunk in the browser first. Until online storage is connected they are kept on the sender's device only:
the link then works everywhere, and shows the photos on that device. To make photos shareable to anyone:

1. Create a free Supabase project and run `supabase/storage.sql` in its SQL editor.
2. Put the project URL and anon key in `.env.local` (see `.env.example`) and in the host's environment variables.

Photo references in a link are limited to three safe shapes (see `src/lib/photo.ts`), so a tampered link cannot make
the page load an arbitrary address.

## How it is built

Stack: Next.js, react-three-fiber (the 3D scene), Supabase (photo storage only). Planning and build notes are tracked in `SPEC.md` and `CLAUDE.md`.

## Credits

Fonts: Inter and Fraunces (SIL Open Font License), bundled locally.

Textures and sky lighting from [Poly Haven](https://polyhaven.com) (CC0), bundled locally in `public/assets`: Brown Planks 04, Reed Roof 03, Snow 02, Bamboo Wall, and the Kiara 9 Dusk HDRI.

Any third-party 3D model credits are listed here when added.

## Privacy

Calendars are unlisted links. There is no public gallery. Recipient progress is stored only in the recipient's own browser.
