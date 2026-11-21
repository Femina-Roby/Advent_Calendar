import { describe, expect, it } from "vitest";
import { decodeCalendar, encodeCalendar, type ShareInput } from "./share";
import { templateDoors } from "./templates";

const doors = (fn: (i: number) => { body: string; link: string }) => Array.from({ length: 24 }, (_, i) => fn(i));

const sample = (over: Partial<ShareInput> = {}): ShareInput => ({
  title: "Christmas for Anu",
  recipientName: "Anu",
  closingNote: "Merry Christmas, Anu.",
  doors: doors((i) => ({ body: `Message for door ${i + 1}`, link: i === 2 ? "https://example.com/song" : "" })),
  ...over,
});

describe("share links", () => {
  it("round-trips a calendar", async () => {
    const frag = await encodeCalendar(sample());
    const cal = await decodeCalendar(frag);
    expect(cal).not.toBeNull();
    expect(cal!.recipientName).toBe("Anu");
    expect(cal!.title).toBe("Christmas for Anu");
    expect(cal!.closingNote).toBe("Merry Christmas, Anu.");
    expect(cal!.doors).toHaveLength(24);
    expect(cal!.doors[0].body).toBe("Message for door 1");
    expect(cal!.doors[2].linkUrl).toBe("https://example.com/song");
    expect(cal!.doors[3].linkUrl).toBeNull();
  });

  it("keeps Malayalam, Manglish and emoji intact", async () => {
    const body = "ക്രിസ്മസ് ആശംസകൾ! Ente favourite oru kadha 🎄";
    const cal = await decodeCalendar(await encodeCalendar(sample({ doors: doors(() => ({ body, link: "" })) })));
    expect(cal!.doors[5].body).toBe(body);
  });

  it("falls back to a default title and no closing note", async () => {
    const cal = await decodeCalendar(await encodeCalendar(sample({ title: "  ", closingNote: "" })));
    expect(cal!.title).toBe("A calendar for Anu");
    expect(cal!.closingNote).toBeNull();
  });

  it("gives the same calendar the same progress key, and different ones different keys", async () => {
    const a = await decodeCalendar(await encodeCalendar(sample()));
    const b = await decodeCalendar(await encodeCalendar(sample()));
    const c = await decodeCalendar(await encodeCalendar(sample({ recipientName: "Meera" })));
    expect(a!.slug).toBe(b!.slug);
    expect(a!.slug).not.toBe(c!.slug);
    expect(a!.slug).toMatch(/^s[A-Za-z0-9_-]{11}$/);
  });

  it("drops unsafe links when reading", async () => {
    const frag = await encodeCalendar(sample({ doors: doors(() => ({ body: "x", link: "javascript:alert(1)" })) }));
    const cal = await decodeCalendar(frag);
    expect(cal!.doors.every((d) => d.linkUrl === null)).toBe(true);
  });

  it("compresses a full starter set well under a messaging-friendly size", async () => {
    const starter = templateDoors("Anu").map((d) => ({ body: d.body, link: "" }));
    const frag = await encodeCalendar(sample({ doors: starter }));
    expect(frag.length).toBeLessThan(2500);
  });

  it("carries photo references and drops any that are not an accepted shape", async () => {
    const frag = await encodeCalendar(
      sample({
        doors: doors((i) => ({
          body: "x",
          link: "",
          photo: i === 0 ? "Ab12Cd34Ef56Gh78/1.webp" : i === 1 ? "local:abc123XYZ" : i === 2 ? "https://evil.example/x.png" : "",
        })),
      }),
    );
    const cal = await decodeCalendar(frag);
    expect(cal!.doors[0].photoPath).toBe("Ab12Cd34Ef56Gh78/1.webp");
    expect(cal!.doors[1].photoPath).toBe("local:abc123XYZ");
    expect(cal!.doors[2].photoPath).toBeNull();
    expect(cal!.doors[3].photoPath).toBeNull();
  });

  it("still reads links made before photos existed", async () => {
    // Two-element door tuples, as the first version wrote them.
    const old = JSON.stringify({ v: 1, t: "Old", n: "Anu", c: "", d: Array.from({ length: 24 }, (_, i) => [`m${i}`, ""]) });
    const bytes = new TextEncoder().encode(old);
    const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const cal = await decodeCalendar("r" + b64);
    expect(cal).not.toBeNull();
    expect(cal!.doors[4].body).toBe("m4");
    expect(cal!.doors[4].photoPath).toBeNull();
  });

  it("refuses damaged or foreign fragments", async () => {
    expect(await decodeCalendar("")).toBeNull();
    expect(await decodeCalendar("#")).toBeNull();
    expect(await decodeCalendar("hello")).toBeNull();
    expect(await decodeCalendar("zAAAA")).toBeNull();
    const frag = await encodeCalendar(sample());
    expect(await decodeCalendar(frag.slice(0, frag.length - 12))).toBeNull();
    expect(await decodeCalendar("x" + frag.slice(1))).toBeNull();
  });

  it("refuses to encode a calendar with a message over the limit or missing doors", async () => {
    await expect(encodeCalendar(sample({ doors: doors(() => ({ body: "a".repeat(601), link: "" })) }))).rejects.toThrow();
    await expect(encodeCalendar(sample({ doors: sample().doors.slice(0, 23) }))).rejects.toThrow();
    await expect(encodeCalendar(sample({ recipientName: "  " }))).rejects.toThrow();
  });
});
