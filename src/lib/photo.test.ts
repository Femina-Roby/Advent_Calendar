import { describe, expect, it } from "vitest";
import { cleanPhotoRef, parsePhotoRef } from "./photo";

describe("parsePhotoRef", () => {
  it("accepts the three known shapes", () => {
    expect(parsePhotoRef("local:abc123XYZ_-")).toEqual({ kind: "local", id: "abc123XYZ_-" });
    expect(parsePhotoRef("Ab12Cd34Ef56Gh78/3.webp")).toEqual({ kind: "remote", path: "Ab12Cd34Ef56Gh78/3.webp" });
    expect(parsePhotoRef("/premade/door-01.jpg")).toEqual({ kind: "static", path: "/premade/door-01.jpg" });
  });

  it("rejects anything that could point somewhere else", () => {
    for (const bad of [
      "https://evil.example/x.png",
      "//evil.example/x.png",
      "javascript:alert(1)",
      "data:image/svg+xml;base64,AAAA",
      "/premade/../secret",
      "/etc/passwd",
      "../x/3.webp",
      "local:",
      "local:a",
      "abc/def.webp",
      "Ab12Cd34Ef56Gh78/3.exe",
      "",
    ]) {
      expect(parsePhotoRef(bad), bad).toBeNull();
    }
    expect(parsePhotoRef(null)).toBeNull();
    expect(parsePhotoRef(undefined)).toBeNull();
  });

  it("cleanPhotoRef returns the reference or an empty string", () => {
    expect(cleanPhotoRef("local:abc123")).toBe("local:abc123");
    expect(cleanPhotoRef("https://evil.example/x.png")).toBe("");
    expect(cleanPhotoRef(null)).toBe("");
  });
});
