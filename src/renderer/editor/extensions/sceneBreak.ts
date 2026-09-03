import { Node } from "@tiptap/core";

export const SceneBreak = Node.create({
  name: "sceneBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "div[data-scene-break]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-scene-break": "true", ...HTMLAttributes }];
  },
});
