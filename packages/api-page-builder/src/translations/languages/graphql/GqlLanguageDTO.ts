export interface GqlLanguageDTO {
    id: string;
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    isBaseLanguage: boolean;
}
