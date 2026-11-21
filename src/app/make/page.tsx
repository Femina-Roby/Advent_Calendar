"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, btn } from "@/components/ui/Button";
import {
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LinkIcon,
  ShareIcon,
  SparkleIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { StarLantern } from "@/components/ui/StarLantern";
import { copy } from "@/lib/copy";
import { GIFTS, GIFT_OPENS } from "@/lib/gifts";
import { type MakerDraft, useMakerDraft } from "@/lib/maker-draft";
import { forgetPhoto, savePhoto } from "@/lib/photo-upload";
import { DOOR_COUNT, safeUrl } from "@/lib/schema";
import { encodeCalendar } from "@/lib/share";
import { onlineStorageConfigured, photoUrl } from "@/lib/storage";
import { templateDoors } from "@/lib/templates";

type Step = 0 | 1 | 2;
type Update = (fn: (d: MakerDraft) => MakerDraft) => void;
type DoorPatch = Partial<MakerDraft["doors"][number]>;

const linkOk = (v: string) => !v.trim() || safeUrl.safeParse(v).success;
const pad = (n: number) => String(n).padStart(2, "0");

const label = "mb-2 block text-[0.7rem] font-semibold tracking-[0.2em] text-faint uppercase";
const underline =
  "w-full border-0 border-b border-[var(--hairline-soft)] bg-transparent px-0 py-3 font-serif text-2xl text-cream placeholder:text-faint/60 transition-colors focus:border-gold focus:outline-none";
const box =
  "w-full rounded-2xl border border-[var(--hairline-soft)] bg-white/[0.04] p-4 font-serif text-lg leading-relaxed text-cream placeholder:text-faint/60 transition-colors focus:border-gold focus:outline-none";

function Header({ step }: { step: Step }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3" aria-label="Kettuvallam Advent, home">
        <StarLantern size={30} />
        <span className="eyebrow !text-cream/80">Kettuvallam Advent</span>
      </Link>
      <ol className="flex items-center gap-3" aria-label="Progress">
        {copy.maker.steps.map((name, i) => (
          <li key={name} aria-current={i === step ? "step" : undefined} className="flex items-center gap-3">
            <span className={`flex items-center gap-2 text-sm ${i === step ? "text-cream" : i < step ? "text-gold" : "text-faint"}`}>
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs tabular-nums ${i === step ? "border-gold bg-gold text-[#2a1d08]" : i < step ? "border-gold/60 text-gold" : "border-[var(--hairline-soft)]"}`}
              >
                {i < step ? <CheckIcon width={14} height={14} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{name}</span>
            </span>
            {i < 2 ? <span className="h-px w-5 bg-[var(--hairline-soft)] sm:w-8" aria-hidden /> : null}
          </li>
        ))}
      </ol>
    </header>
  );
}

function Title({ eyebrow, children, help }: { eyebrow: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="anim-rise">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-[1.08] font-light md:text-5xl">{children}</h1>
      {help ? <p className="mt-4 max-w-xl text-lg text-dim">{help}</p> : null}
    </div>
  );
}

function WhoStep({ draft, update, onNext }: { draft: MakerDraft; update: Update; onNext: () => void }) {
  return (
    <section className="mx-auto mt-14 max-w-2xl">
      <Title eyebrow="Make a calendar · 1 of 3" help={copy.maker.whoHelp}>
        Who is it <em className="font-normal text-gold-bright">for?</em>
      </Title>
      <div className="anim-rise mt-12 space-y-9" style={{ animationDelay: "120ms" }}>
        <label className="block">
          <span className={label}>{copy.maker.nameLabel}</span>
          <input
            className={underline}
            value={draft.recipientName}
            maxLength={80}
            autoFocus
            onChange={(e) => update((d) => ({ ...d, recipientName: e.target.value }))}
            placeholder="Anu"
          />
        </label>
        <label className="block">
          <span className={label}>{copy.maker.titleLabel}</span>
          <input
            className={underline}
            value={draft.title}
            maxLength={120}
            onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
            placeholder={draft.recipientName.trim() ? `A calendar for ${draft.recipientName.trim()}` : "A calendar for you"}
          />
        </label>
        <label className="block">
          <span className={label}>{copy.maker.closingLabel}</span>
          <textarea
            className={`${box} min-h-28`}
            value={draft.closingNote}
            maxLength={600}
            onChange={(e) => update((d) => ({ ...d, closingNote: e.target.value }))}
            placeholder="Whatever you would say at the last door."
          />
        </label>
        <Button onClick={onNext} disabled={!draft.recipientName.trim()}>
          {copy.maker.next}
        </Button>
      </div>
    </section>
  );
}

/** Add a photo from the device: a calm drop-zone, then a thumbnail with change and remove. */
function PhotoField({ doorNumber, value, onChange }: { doorNumber: number; value: string; onChange: (ref: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = photoUrl(value);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await savePhoto(file, doorNumber);
      if (value) forgetPhoto(value);
      onChange(saved.ref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that picture.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className={label}>{copy.maker.photoLabel}</span>
      <input ref={input} type="file" accept="image/*" className="sr-only" id={`photo-${doorNumber}`} onChange={(e) => pick(e.target.files?.[0])} disabled={busy} />
      {value ? (
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--hairline-soft)] bg-white/[0.04] p-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`Photo for door ${doorNumber}`} className="size-20 rounded-lg object-cover" />
          ) : (
            <span className="grid size-20 place-items-center rounded-lg bg-white/5 px-2 text-center text-xs text-faint">Not on this device</span>
          )}
          <div className="flex flex-col items-start gap-1">
            <label htmlFor={`photo-${doorNumber}`} className={btn("quiet", "sm", "cursor-pointer !px-3")}>
              {busy ? copy.maker.addingPhoto : copy.maker.changePhoto}
            </label>
            <Button
              variant="quiet"
              size="sm"
              className="!px-3"
              onClick={() => {
                forgetPhoto(value);
                onChange("");
              }}
            >
              {copy.maker.removePhoto}
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`photo-${doorNumber}`}
          className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-[var(--hairline)] p-4 transition hover:bg-white/[0.05] ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="grid size-11 place-items-center rounded-full bg-gold/15 text-gold">
            <CameraIcon />
          </span>
          <span>
            <span className="block text-cream">{busy ? copy.maker.addingPhoto : copy.maker.addPhoto}</span>
            <span className="block text-sm text-faint">It is resized for you. It floats out as a polaroid.</span>
          </span>
        </label>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[#ff9b8f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DoorsStep({ draft, update, onBack, onNext }: { draft: MakerDraft; update: Update; onBack: () => void; onNext: () => void }) {
  const [sel, setSel] = useState(0);
  const editor = useRef<HTMLDivElement>(null);
  const starter = useMemo(() => templateDoors(draft.recipientName), [draft.recipientName]);
  const door = draft.doors[sel];

  // On a phone the editor sits above the grid, so picking a door brings it into view.
  const choose = (i: number) => {
    setSel(i);
    if (window.matchMedia("(max-width: 1023px)").matches) editor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const gift = GIFTS[sel];
  const filled = draft.doors.filter((d) => d.body.trim()).length;
  const badLinks = draft.doors.filter((d) => !linkOk(d.link)).length;
  const ready = filled === DOOR_COUNT && badLinks === 0;

  const setDoor = (i: number, patch: DoorPatch) =>
    update((d) => ({ ...d, doors: d.doors.map((x, k) => (k === i ? { ...x, ...patch, source: patch.source ?? "manual" } : x)) }));

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Title eyebrow="Make a calendar · 2 of 3" help={copy.maker.doorsHelp}>
          Fill the <em className="font-normal text-gold-bright">24 doors</em>
        </Title>
        <div className="min-w-56">
          <p className="mb-2 text-sm text-dim tabular-nums" aria-live="polite">
            {filled} / {DOOR_COUNT} written
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright transition-[width] duration-500" style={{ width: `${(filled / DOOR_COUNT) * 100}%` }} />
          </div>
          <Button
            variant="glass"
            size="sm"
            className="mt-4"
            icon={<SparkleIcon width={16} height={16} />}
            onClick={() =>
              update((d) => ({
                ...d,
                doors: d.doors.map((x, i) => (x.body.trim() ? x : { ...x, body: starter[i].body, source: "template" as const })),
              }))
            }
          >
            {copy.maker.starterFill}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_27rem]">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Doors">
          {draft.doors.map((d, i) => {
            const empty = !d.body.trim();
            const on = i === sel;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  aria-pressed={on}
                  className={`glass group relative h-full w-full rounded-2xl p-4 text-left transition duration-300 ${on ? "!border-gold shadow-[0_0_0_1px_var(--gold),0_18px_40px_-18px_rgb(226_184_98/0.45)]" : "hover:!border-[var(--hairline)] hover:bg-white/[0.04]"}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-serif text-[1.75rem] leading-none font-light text-gold-bright tabular-nums">{pad(i + 1)}</span>
                    <span className="flex items-center gap-1.5 text-gold/80">
                      {d.photo ? <CameraIcon width={15} height={15} aria-label="Has a photo" role="img" /> : null}
                      {d.link.trim() ? <LinkIcon width={15} height={15} aria-label="Has a link" role="img" /> : null}
                      <span
                        title={empty ? "Empty" : d.source === "template" ? "Starter text" : "Written by you"}
                        className={`ml-1 size-2 rounded-full ${empty ? "border border-faint" : d.source === "template" ? "bg-gold/45" : "bg-gold-bright shadow-[0_0_8px_var(--gold-bright)]"}`}
                      />
                    </span>
                  </span>
                  <span className="mt-3 block text-[0.65rem] font-semibold tracking-[0.18em] text-faint uppercase">{GIFTS[i].label}</span>
                  <span className="mt-1.5 line-clamp-2 block font-serif text-[0.95rem] leading-snug text-dim">{empty ? "Nothing yet" : d.body}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div ref={editor} className="glass glass-gold order-first h-fit scroll-mt-4 rounded-3xl p-6 lg:sticky lg:top-6 lg:order-none">
          <p className="eyebrow">Door {pad(sel + 1)}</p>
          <h2 className="mt-2 text-3xl font-light">{gift.label}</h2>
          <p className="mt-1 font-serif text-dim italic">When opened, it {GIFT_OPENS[gift.kind]}.</p>

          <div className="mt-6 space-y-6">
            <label className="block">
              <span className={label}>{copy.maker.messageLabel}</span>
              <textarea className={`${box} min-h-36 text-xl`} value={door.body} maxLength={600} onChange={(e) => setDoor(sel, { body: e.target.value })} />
              <span className="mt-1 block text-right text-xs text-faint tabular-nums">{door.body.length} / 600</span>
            </label>
            <PhotoField doorNumber={sel + 1} value={door.photo} onChange={(ref) => setDoor(sel, { photo: ref })} />
            <label className="block">
              <span className={label}>{copy.maker.linkLabel}</span>
              <span className="relative block">
                <LinkIcon className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" width={18} height={18} />
                <input
                  className={`${box} !py-3 !pl-11 font-sans text-base`}
                  type="url"
                  inputMode="url"
                  value={door.link}
                  placeholder="https://"
                  onChange={(e) => setDoor(sel, { link: e.target.value })}
                  aria-invalid={!linkOk(door.link)}
                />
              </span>
              {!linkOk(door.link) ? <span className="mt-1.5 block text-sm text-[#ff9b8f]">{copy.maker.badLink}</span> : null}
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[var(--hairline-soft)] pt-4">
            <div className="flex gap-1">
              <Button variant="glass" size="icon" onClick={() => setSel((sel + DOOR_COUNT - 1) % DOOR_COUNT)} aria-label="Previous door">
                <ChevronLeftIcon />
              </Button>
              <Button variant="glass" size="icon" onClick={() => setSel((sel + 1) % DOOR_COUNT)} aria-label="Next door">
                <ChevronRightIcon />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="quiet" size="sm" onClick={() => setDoor(sel, { body: starter[sel].body, source: "template" })}>
                {copy.maker.resetDoor}
              </Button>
              <Button
                variant="quiet"
                size="sm"
                icon={<TrashIcon width={16} height={16} />}
                onClick={() => {
                  if (door.photo) forgetPhoto(door.photo);
                  setDoor(sel, { body: "", link: "", photo: "" });
                }}
              >
                {copy.maker.clearDoor}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--hairline-soft)] pt-6">
        <Button variant="glass" onClick={onBack}>
          {copy.maker.back}
        </Button>
        <Button onClick={onNext} disabled={!ready}>
          {copy.maker.toShare}
        </Button>
        {!ready ? (
          <p className="text-sm text-faint" aria-live="polite">
            {filled < DOOR_COUNT ? `${DOOR_COUNT - filled} more ${DOOR_COUNT - filled === 1 ? "door needs" : "doors need"} a message.` : "Fix the links first."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ShareStep({ draft, onBack, onNew }: { draft: MakerDraft; onBack: () => void; onNew: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");
  const localPhotos = draft.doors.filter((d) => d.photo.startsWith("local:")).length;

  useEffect(() => {
    let live = true;
    encodeCalendar({
      title: draft.title.trim(),
      recipientName: draft.recipientName.trim(),
      closingNote: draft.closingNote.trim(),
      doors: draft.doors.map((d) => ({ body: d.body.trim(), link: d.link.trim(), photo: d.photo })),
    })
      .then((frag) => live && setLink(`${window.location.origin}/c/s#${frag}`))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [draft]);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.getElementById("share-link") as HTMLInputElement | null;
      el?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="mx-auto mt-14 max-w-2xl text-center">
      <StarLantern size={84} className="mx-auto drop-shadow-[0_0_28px_rgb(242_169_59/0.55)]" />
      <div className="anim-rise mt-8">
        <p className="eyebrow">Make a calendar · 3 of 3</p>
        <h1 className="mt-3 text-4xl leading-[1.08] font-light md:text-5xl">
          Your calendar is <em className="font-normal text-gold-bright">ready</em>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-dim">{copy.maker.shareHelp}</p>
      </div>

      {localPhotos > 0 && !onlineStorageConfigured() ? (
        <p role="status" className="glass mx-auto mt-8 max-w-lg rounded-2xl border-l-2 !border-l-gold px-5 py-4 text-left text-sm text-dim">
          {localPhotos === 1 ? "1 photo is" : `${localPhotos} photos are`} saved on this device only, because online photo storage isn&apos;t connected. Opening
          the link here shows everything. On another device the messages and links show, but not {localPhotos === 1 ? "that photo" : "those photos"}.
        </p>
      ) : null}

      {error ? (
        <p className="mt-8 text-[#ff9b8f]">Something is too long to fit in a link. Shorten a message and try again.</p>
      ) : (
        <div className="glass glass-gold mt-10 flex items-center gap-2 rounded-full p-1.5 pl-6">
          <input
            id="share-link"
            readOnly
            aria-label="Share link"
            className="min-w-0 flex-1 truncate bg-transparent text-sm text-dim focus:text-cream focus:outline-none"
            value={link ?? "Preparing your link…"}
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button onClick={copyLink} disabled={!link} size="sm" icon={copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}>
            {copied ? copy.maker.copied : copy.maker.copy}
          </Button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {canShare && link ? (
          <Button
            variant="glass"
            icon={<ShareIcon width={18} height={18} />}
            onClick={() => navigator.share({ title: draft.title || `A calendar for ${draft.recipientName}`, url: link }).catch(() => {})}
          >
            {copy.maker.share}
          </Button>
        ) : null}
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className={btn("glass", "md")}>
            {copy.maker.preview}
          </a>
        ) : null}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-2 border-t border-[var(--hairline-soft)] pt-6">
        <Button variant="quiet" onClick={onBack}>
          {copy.maker.back}
        </Button>
        <Button variant="quiet" onClick={onNew}>
          {copy.maker.startNew}
        </Button>
      </div>
    </section>
  );
}

export default function MakePage() {
  const { draft, update, clear } = useMakerDraft();
  const [step, setStep] = useState<Step>(0);

  return (
    <div className="sky-backdrop min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-5 py-7 md:px-10 md:py-9">
        <Header step={step} />
        {step === 0 ? <WhoStep draft={draft} update={update} onNext={() => setStep(1)} /> : null}
        {step === 1 ? <DoorsStep draft={draft} update={update} onBack={() => setStep(0)} onNext={() => setStep(2)} /> : null}
        {step === 2 ? (
          <ShareStep
            draft={draft}
            onBack={() => setStep(1)}
            onNew={() => {
              draft.doors.forEach((d) => d.photo && forgetPhoto(d.photo));
              clear();
              setStep(0);
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
