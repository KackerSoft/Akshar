export const PAGE_FORMATS = ["A4", "A5", "LETTER", "LEGAL"] as const;
export type PageFormat = (typeof PAGE_FORMATS)[number];

export const PAGE_FORMAT_LABELS: Record<PageFormat, string> = {
  A4: "A4",
  A5: "A5",
  LETTER: "US Letter",
  LEGAL: "US Legal",
};
