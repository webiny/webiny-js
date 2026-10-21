/**
 * The language global components are stored in: the language code of the page (or layout) they are shown in,
 * or `"default"` for pages and layouts without a language.
 */
export class GlobalComponentLanguage {
    static readonly DEFAULT = "default";

    private readonly code: string;

    private constructor(code: string) {
        this.code = code;
    }

    static from(language: string | null | undefined): GlobalComponentLanguage {
        return new GlobalComponentLanguage(language || GlobalComponentLanguage.DEFAULT);
    }

    toString(): string {
        return this.code;
    }
}
