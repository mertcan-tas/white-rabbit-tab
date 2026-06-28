import { beforeEach, describe, expect, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAreaStore } from "./area-store.js";

function seed(store) {
  store.areas = [
    { label: "A", apps: [
      { name: "one", url: "https://one.com", icon: "i1" },
      { name: "two", url: "https://two.com", icon: "i2" },
      { name: "three", url: "https://three.com", icon: "i3" },
    ] },
    { label: "B", apps: [{ name: "b1", url: "https://b1.com", icon: "ib" }] },
  ];
  store.faviconCache = {};
}

describe("reorderItem / removeItem", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("moves an item to a new index", () => {
    const s = useAreaStore();
    seed(s);
    s.reorderItem(0, 0, 2);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["two", "three", "one"]);
  });

  it("is a no-op when from === to", () => {
    const s = useAreaStore();
    seed(s);
    s.reorderItem(0, 1, 1);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["one", "two", "three"]);
  });

  it("removes an item by index", () => {
    const s = useAreaStore();
    seed(s);
    s.removeItem(0, 1);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["one", "three"]);
  });
});

describe("updateItem / moveItemToArea / reorderArea / reorderInFolder", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("renames without touching icon", () => {
    const s = useAreaStore(); seed(s);
    s.updateItem(0, 0, { name: "renamed" });
    expect(s.areas[0].apps[0].name).toBe("renamed");
    expect(s.areas[0].apps[0].icon).toBe("i1");
  });

  it("recomputes icon when hostname changes", () => {
    const s = useAreaStore(); seed(s);
    s.updateItem(0, 0, { url: "github.com" });
    expect(s.areas[0].apps[0].url).toBe("https://github.com/");
    expect(s.areas[0].apps[0].icon).toContain("github.com");
  });

  it("moves an item to another area (appended)", () => {
    const s = useAreaStore(); seed(s);
    s.moveItemToArea(0, 0, 1);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["two", "three"]);
    expect(s.areas[1].apps.map((a) => a.name)).toEqual(["b1", "one"]);
  });

  it("reorders areas", () => {
    const s = useAreaStore(); seed(s);
    s.reorderArea(0, 1);
    expect(s.areas.map((a) => a.label)).toEqual(["B", "A"]);
  });

  it("reorders items inside a folder", () => {
    const s = useAreaStore();
    setActivePinia(createPinia());
    s.areas = [{ label: "A", apps: [
      { type: "folder", name: "f", apps: [
        { name: "x", url: "https://x.com", icon: "ix" },
        { name: "y", url: "https://y.com", icon: "iy" },
      ] },
    ] }];
    s.faviconCache = {};
    s.reorderInFolder(0, 0, 0, 1);
    expect(s.areas[0].apps[0].apps.map((a) => a.name)).toEqual(["y", "x"]);
  });
});
