export type DeviceKind = "phone" | "tablet" | "ereader";

export type PreviewDevice = {
  id: string;
  label: string;
  kind: DeviceKind;
  widthPx: number;
  heightPx: number;
};

export const PREVIEW_DEVICES: PreviewDevice[] = [
  { id: "paperwhite", label: "Kindle Paperwhite", kind: "ereader", widthPx: 600, heightPx: 780 },
  { id: "oasis", label: "Kindle Oasis", kind: "ereader", widthPx: 590, heightPx: 760 },
  { id: "nook", label: "Nook Glowlight 3", kind: "ereader", widthPx: 600, heightPx: 800 },
  { id: "kobo", label: "Kobo Forma", kind: "ereader", widthPx: 700, heightPx: 840 },
  { id: "iphone", label: "iPhone", kind: "phone", widthPx: 390, heightPx: 740 },
  { id: "galaxy", label: "Galaxy S21", kind: "phone", widthPx: 384, heightPx: 780 },
  { id: "ipad", label: "iPad", kind: "tablet", widthPx: 768, heightPx: 1000 },
  { id: "fire", label: "Kindle Fire", kind: "tablet", widthPx: 760, heightPx: 980 },
];

export function previewDevice(id: string): PreviewDevice {
  return PREVIEW_DEVICES.find((d) => d.id === id) ?? PREVIEW_DEVICES[0];
}
