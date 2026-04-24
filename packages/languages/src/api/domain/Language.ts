export interface Language {
    id: string;
    name: string;
    code: string;
    direction: "ltr" | "rtl";
    isDefault: boolean;
    enabled: boolean;
}
