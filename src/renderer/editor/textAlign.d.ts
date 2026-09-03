import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textAlign: {
      setTextAlign: (alignment: "left" | "center" | "right" | "justify") => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}
