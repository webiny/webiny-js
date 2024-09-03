export interface CmsLanguageDTO {
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    baseLanguage: boolean;
}
