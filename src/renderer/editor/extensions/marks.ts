import { Mark } from "@tiptap/core";

export const SmallCaps = Mark.create({
  name: "smallCaps",
  parseHTML() {
    return [{ tag: "span.mark-small-caps" }];
  },
  renderHTML() {
    return ["span", { class: "mark-small-caps" }];
  },
});

export const Monospace = Mark.create({
  name: "monospace",
  parseHTML() {
    return [{ tag: "span.mark-mono" }];
  },
  renderHTML() {
    return ["span", { class: "mark-mono" }];
  },
});

export const SansSerif = Mark.create({
  name: "sansSerif",
  parseHTML() {
    return [{ tag: "span.mark-sans" }];
  },
  renderHTML() {
    return ["span", { class: "mark-sans" }];
  },
});
