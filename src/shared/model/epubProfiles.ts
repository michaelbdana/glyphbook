export type EpubProfileId =
  | "kindle"
  | "nook"
  | "google"
  | "apple"
  | "kobo"
  | "generic";

export type EpubProfile = {
  id: EpubProfileId;
  label: string;
  store: string;
  fileNameSuffix: string;
  includeCoverPage: boolean;
  includeNcx: boolean;
  notes: string;
};

export const EPUB_PROFILES: EpubProfile[] = [
  {
    id: "kindle",
    label: "Kindle",
    store: "Amazon KDP",
    fileNameSuffix: "KDP",
    includeCoverPage: false,
    includeNcx: true,
    notes:
      "Amazon adds the cover automatically during upload, so the interior cover page is removed. Uses EPUB3 with nav + NCX and Kindle-friendly simple HTML/CSS.",
  },
  {
    id: "nook",
    label: "Nook",
    store: "Barnes & Noble Press",
    fileNameSuffix: "NOOK",
    includeCoverPage: true,
    includeNcx: true,
    notes:
      "EPUB accepted by B&N Press. Keeps the cover as the first page and includes both EPUB3 nav and NCX so legacy Nook readers get a working table of contents.",
  },
  {
    id: "google",
    label: "Google Play",
    store: "Google Play Books",
    fileNameSuffix: "GooglePlay",
    includeCoverPage: true,
    includeNcx: true,
    notes:
      "Standard EPUB3 for Google Play Books with a nav table of contents and embedded cover metadata.",
  },
  {
    id: "apple",
    label: "iBooks",
    store: "Apple Books",
    fileNameSuffix: "Apple",
    includeCoverPage: true,
    includeNcx: true,
    notes:
      "EPUB for Apple Books with clean OPF metadata and navigation. Apple pulls the cover from the embedded cover metadata.",
  },
  {
    id: "kobo",
    label: "Kobo",
    store: "Kobo Writing Life",
    fileNameSuffix: "Kobo",
    includeCoverPage: true,
    includeNcx: true,
    notes:
      "Kobo reads the first page of content as the cover, so the cover page stays first. Includes NCX for older Kobo readers and uses conservative styling.",
  },
  {
    id: "generic",
    label: "Generic",
    store: "Any EPUB reader / other stores",
    fileNameSuffix: "EPUB",
    includeCoverPage: true,
    includeNcx: true,
    notes:
      "Balanced universal EPUB3 — cover page, EPUB3 nav and NCX table of contents, standard XHTML/CSS that validates with epubcheck.",
  },
];

export function epubProfile(id: string): EpubProfile {
  return EPUB_PROFILES.find((p) => p.id === id) ?? EPUB_PROFILES[5];
}
