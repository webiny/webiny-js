import { TypographyHTMLTag } from "~/types";

type ThemeTypographyMetaData = {
    // Name to be displayed on UI
    displayName: string;
    htmlTag: TypographyHTMLTag;
};

const TYPOGRAPHY_META_DATA: Record<string, ThemeTypographyMetaData> = {
    normal: { displayName: "Normal", htmlTag: "p" },
    heading1: { displayName: "Heading 1", htmlTag: "h1" },
    heading2: { displayName: "Heading 2", htmlTag: "h2" },
    heading3: { displayName: "Heading 3", htmlTag: "h3" },
    heading4: { displayName: "Heading 4", htmlTag: "h4" },
    heading5: { displayName: "Heading 5", htmlTag: "h5" },
    heading6: { displayName: "Heading 6", htmlTag: "h6" },
    paragraph1: { displayName: "Paragraph 1", htmlTag: "p" },
    paragraph2: { displayName: "Paragraph 2", htmlTag: "p" }
};

/*
 * @description Return metadata for the specific typography set in the theme.
 * Note: As default will return metadata for 'normal' typography style.
 */
export const getTypographyMetaByName = (themeTypographyName: string): ThemeTypographyMetaData => {
    const data = TYPOGRAPHY_META_DATA[themeTypographyName];
    return data ?? TYPOGRAPHY_META_DATA["normal"];
};
