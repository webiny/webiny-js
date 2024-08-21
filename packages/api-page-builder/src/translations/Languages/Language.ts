export class Language {
    public readonly name: string;
    public readonly code: string;
    public readonly direction: "ltr" | "rtl";
    public readonly isBaseLanguage: boolean;

    constructor(name: string, code: string, direction: "ltr" | "rtl", isBaseLanguage: boolean) {
        this.name = name;
        this.code = code;
        this.direction = direction;
        this.isBaseLanguage = isBaseLanguage;
    }
}
