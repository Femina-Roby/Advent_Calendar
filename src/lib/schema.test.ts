import { describe, expect, it } from "vitest";
import premade from "@/fixtures/premade.json";
import templates from "@/fixtures/templates.json";
import { templateDoors } from "./templates";
import { DOOR_COUNT, draftBatchSchema, publicCalendarSchema, safeUrl } from "./schema";

describe("fixtures", () => {
  it("premade calendar validates", () => {
    expect(publicCalendarSchema.safeParse(premade).success).toBe(true);
  });

  it("has exactly 24 templates", () => {
    expect(templates).toHaveLength(DOOR_COUNT);
  });

  it("template doors fill the recipient name and validate inside a calendar", () => {
    const doors = templateDoors("Meera");
    expect(doors[0].body).toContain("Meera");
    expect(doors.every((d) => !d.body.includes("{name}"))).toBe(true);
    const cal = { ...premade, doors };
    expect(publicCalendarSchema.safeParse(cal).success).toBe(true);
  });
});

describe("safeUrl", () => {
  it("accepts http and https", () => {
    expect(safeUrl.safeParse("https://example.com/a?b=1").success).toBe(true);
    expect(safeUrl.safeParse("http://example.com").success).toBe(true);
  });

  it("rejects other schemes and junk", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "example.com", ""]) {
      expect(safeUrl.safeParse(bad).success).toBe(false);
    }
  });
});

describe("publicCalendarSchema", () => {
  it("rejects 23 doors", () => {
    expect(publicCalendarSchema.safeParse({ ...premade, doors: premade.doors.slice(0, 23) }).success).toBe(false);
  });

  it("rejects mis-numbered doors", () => {
    const doors = premade.doors.map((d) => ({ ...d }));
    doors[4].number = 9;
    expect(publicCalendarSchema.safeParse({ ...premade, doors }).success).toBe(false);
  });

  it("rejects a door with an unsafe link", () => {
    const doors = premade.doors.map((d) => ({ ...d }));
    doors[0].linkUrl = "javascript:alert(1)";
    expect(publicCalendarSchema.safeParse({ ...premade, doors }).success).toBe(false);
  });
});

describe("draftBatchSchema", () => {
  it("accepts a valid batch and rejects empty bodies", () => {
    expect(draftBatchSchema.safeParse([{ number: 1, body: "Hello" }]).success).toBe(true);
    expect(draftBatchSchema.safeParse([{ number: 1, body: "" }]).success).toBe(false);
    expect(draftBatchSchema.safeParse([{ number: 25, body: "Hi" }]).success).toBe(false);
  });
});
