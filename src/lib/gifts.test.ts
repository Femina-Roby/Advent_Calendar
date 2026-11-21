import { describe, expect, it } from "vitest";
import { GIFTS } from "./gifts";

describe("GIFTS", () => {
  it("has exactly 24 gifts in door order", () => {
    expect(GIFTS).toHaveLength(24);
  });

  it("makes every gift a different kind of object", () => {
    expect(new Set(GIFTS.map((g) => g.kind)).size).toBe(24);
    expect(new Set(GIFTS.map((g) => g.label)).size).toBe(24);
  });

  it("never puts two gifts on top of each other", () => {
    for (let i = 0; i < 24; i++) {
      for (let j = i + 1; j < 24; j++) {
        const [a, b] = [GIFTS[i].pos, GIFTS[j].pos];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        expect(d, `doors ${i + 1} and ${j + 1}`).toBeGreaterThan(0.8);
      }
    }
  });

  it("spreads gifts around the boat, so rotating is needed to see them all", () => {
    const sides = new Set(GIFTS.map(({ pos: [x, , z] }) => `${Math.sign(Math.round(x / 2))}${Math.sign(Math.round(z))}`));
    expect(sides.size).toBeGreaterThanOrEqual(6);
  });

  it("spreads gifts over several heights, from water level to the roof", () => {
    const ys = GIFTS.map((g) => g.pos[1]);
    expect(Math.min(...ys)).toBeLessThan(1);
    expect(Math.max(...ys)).toBeGreaterThan(4.5);
  });
});
