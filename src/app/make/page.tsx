"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
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

const field =
  "w-full rounded-xl border border-paper-3 bg-paper-2/60 px-4 py-3 text-base text-ink placeholder:text-ink-soft/60 focus:border-gold focus:bg-paper";

const linkOk = (v: string) => !v.trim() || safeUrl.safeParse(v).success;

function Steps({ step }: { step: Step }) {
  return (
    <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Progress">
      {copy.maker.steps.map((label, i) => (
        <li
          key={label}
          aria-current={i === step ? "step" : undefined}
          className={`rounded-full px-3 py-1 ${i === step ? "bg-green text-paper" : i < step ? "bg-gold-soft text-green-deep" : "bg-paper-2 text-ink-soft"}`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

function WhoStep({ draft, update, onNext }: { draft: MakerDraft; update: Update; onNext: () => void }) {
  return (
    <section className="kasavu mt-6 space-y-5 p-6 md:p-8">
      <h2 className="text-2xl font-semibold">{copy.maker.whoHeading}</h2>
      <p className="text-ink-soft">{copy.maker.whoHelp}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{copy.maker.nameLabel}</span>
        <input
          className={field}
          value={draft.recipientName}
          maxLength={80}
          autoFocus
          onChange={(e) => update((d) => ({ ...d, recipientName: e.target.value }))}
          placeholder="Anu"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{copy.maker.titleLabel}</span>
        <input
          className={field}
          value={draft.title}
          maxLength={120}
          onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
          placeholder={draft.recipientName.trim() ? `A calendar for ${draft.recipientName.trim()}` : "A calendar for you"}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{copy.maker.closingLabel}</span>
        <textarea
          className={`${field} min-h-24`}
          value={draft.closingNote}
          maxLength={600}
          onChange={(e) => update((d) => ({ ...d, closingNote: e.target.value }))}
        />
      </label>
      <Button onClick={onNext} disabled={!draft.recipientName.trim()}>
        {copy.maker.next}
      </Button>
    </section>
  );
}

/** Add a photo from the device, preview it, or remove it. */
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
      <span className="mb-1 block text-sm font-medium">{copy.maker.photoLabel}</span>
      {value ? (
        <div className="mb-2 flex items-center gap-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`Photo for door ${doorNumber}`} className="h-20 w-20 rounded-lg border-4 border-paper-2 object-cover shadow" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-lg bg-paper-2 text-xs text-ink-soft">Not on this device</span>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              forgetPhoto(value);
              onChange("");
            }}
          >
            {copy.maker.removePhoto}
          </Button>
        </div>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        id={`photo-${doorNumber}`}
        onChange={(e) => pick(e.target.files?.[0])}
        disabled={busy}
      />
      <label
        htmlFor={`photo-${doorNumber}`}
        className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-paper-2 px-5 text-base font-medium text-ink hover:bg-paper-3 focus-within:outline-2 ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        {busy ? copy.maker.addingPhoto : value ? copy.maker.changePhoto : copy.maker.addPhoto}
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-[#a33a35]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DoorsStep({ draft, update, onBack, onNext }: { draft: MakerDraft; update: Update; onBack: () => void; onNext: () => void }) {
  const [sel, setSel] = useState(0);
  const starter = useMemo(() => templateDoors(draft.recipientName), [draft.recipientName]);
  const door = draft.doors[sel];
  const gift = GIFTS[sel];
  const filled = draft.doors.filter((d) => d.body.trim()).length;
  const badLinks = draft.doors.filter((d) => !linkOk(d.link)).length;
  const ready = filled === DOOR_COUNT && badLinks === 0;

  const setDoor = (i: number, patch: DoorPatch) =>
    update((d) => ({ ...d, doors: d.doors.map((x, k) => (k === i ? { ...x, ...patch, source: patch.source ?? "manual" } : x)) }));

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{copy.maker.doorsHeading}</h2>
        <p className="text-sm text-ink-soft" aria-live="polite">
          {filled} / {DOOR_COUNT} written
        </p>
      </div>
      <p className="mt-1 text-ink-soft">{copy.maker.doorsHelp}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="ghost"
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

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_26rem]">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Doors">
          {draft.doors.map((d, i) => {
            const empty = !d.body.trim();
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSel(i)}
                  aria-pressed={i === sel}
                  className={`h-full w-full rounded-xl border p-3 text-left transition ${i === sel ? "border-gold bg-gold-soft/50 shadow-md" : "border-paper-3 bg-paper-2/50 hover:bg-paper-2"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-serif text-lg font-semibold">{i + 1}</span>
                    <span className="flex items-center gap-1 text-xs">
                      {d.photo ? <span title="Has a photo">📷</span> : null}
                      {d.link.trim() ? <span title="Has a link">🔗</span> : null}
                      <span className={`rounded-full px-2 py-0.5 ${empty ? "bg-paper-3 text-ink-soft" : d.source === "template" ? "bg-paper-3 text-green-deep" : "bg-green text-paper"}`}>
                        {empty ? "Empty" : d.source === "template" ? "Starter" : "Yours"}
                      </span>
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-coir">{GIFTS[i].label}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{empty ? "Nothing yet" : d.body}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="kasavu h-fit space-y-4 p-5 lg:sticky lg:top-6">
          <div>
            <h3 className="text-xl font-semibold">
              Door {sel + 1}: {gift.label}
            </h3>
            <p className="text-sm text-ink-soft">When opened, it {GIFT_OPENS[gift.kind]}.</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{copy.maker.messageLabel}</span>
            <textarea
              className={`${field} min-h-32 font-serif text-lg`}
              value={door.body}
              maxLength={600}
              onChange={(e) => setDoor(sel, { body: e.target.value })}
            />
            <span className="mt-1 block text-right text-xs text-ink-soft">{door.body.length} / 600</span>
          </label>
          <PhotoField doorNumber={sel + 1} value={door.photo} onChange={(ref) => setDoor(sel, { photo: ref })} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{copy.maker.linkLabel}</span>
            <input
              className={field}
              type="url"
              inputMode="url"
              value={door.link}
              placeholder="https://"
              onChange={(e) => setDoor(sel, { link: e.target.value })}
              aria-invalid={!linkOk(door.link)}
            />
            {!linkOk(door.link) ? <span className="mt-1 block text-sm text-[#a33a35]">{copy.maker.badLink}</span> : null}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setSel((sel + DOOR_COUNT - 1) % DOOR_COUNT)} aria-label="Previous door">
              ←
            </Button>
            <Button variant="ghost" onClick={() => setSel((sel + 1) % DOOR_COUNT)} aria-label="Next door">
              →
            </Button>
            <Button variant="ghost" onClick={() => setDoor(sel, { body: starter[sel].body, source: "template" })}>
              {copy.maker.resetDoor}
            </Button>
            <Button
              variant="ghost"
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          {copy.maker.back}
        </Button>
        <Button onClick={onNext} disabled={!ready}>
          {copy.maker.toShare}
        </Button>
        {!ready ? (
          <p className="text-sm text-ink-soft" aria-live="polite">
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
      const el = document.getElementById("share-link") as HTMLTextAreaElement | null;
      el?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="kasavu mt-6 space-y-5 p-6 text-center md:p-8">
      <StarLantern size={72} className="mx-auto" />
      <h2 className="text-2xl font-semibold">{copy.maker.shareHeading}</h2>
      <p className="mx-auto max-w-lg text-ink-soft">{copy.maker.shareHelp}</p>
      {localPhotos > 0 && !onlineStorageConfigured() ? (
        <p role="status" className="mx-auto max-w-lg rounded-xl bg-gold-soft/50 px-4 py-3 text-sm text-green-deep">
          {localPhotos === 1 ? "1 photo is" : `${localPhotos} photos are`} saved on this device only, because online photo storage isn&apos;t
          connected yet. Opening this link on this device shows everything. On another device, the messages and links show but not
          {localPhotos === 1 ? " that photo" : " those photos"}.
        </p>
      ) : null}
      {error ? (
        <p className="text-[#a33a35]">Something is too long to fit in a link. Shorten a message and try again.</p>
      ) : (
        <textarea
          id="share-link"
          readOnly
          aria-label="Share link"
          className={`${field} min-h-28 break-all text-sm`}
          value={link ?? "Preparing your link…"}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={copyLink} disabled={!link}>
          {copied ? copy.maker.copied : copy.maker.copy}
        </Button>
        {canShare && link ? (
          <Button variant="ghost" onClick={() => navigator.share({ title: draft.title || `A calendar for ${draft.recipientName}`, url: link }).catch(() => {})}>
            {copy.maker.share}
          </Button>
        ) : null}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-paper-2 px-5 text-base font-medium text-ink hover:bg-paper-3"
          >
            {copy.maker.preview}
          </a>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button variant="ghost" onClick={onBack}>
          {copy.maker.back}
        </Button>
        <Button variant="ghost" onClick={onNew}>
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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <header className="flex items-center gap-4">
        <Link href="/" aria-label="Home">
          <StarLantern size={52} />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">{copy.maker.title}</h1>
          <Steps step={step} />
        </div>
      </header>
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
  );
}
