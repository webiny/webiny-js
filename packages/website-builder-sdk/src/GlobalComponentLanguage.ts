/**
 * The language a global component is stored in: the language code of the page (or layout) it is shown in,
 * or `"default"` for pages and layouts without a language.
 *
 * Kept in step with the API's `GlobalComponentLanguage` (`@webiny/api-website-builder`,
 * `domain/globals/GlobalComponentLanguage.ts`): the packages can't import each other, so change both together.
 */
export class GlobalComponentLanguage {
    // The language of global component records for pages and layouts without a language.
    static readonly DEFAULT = "default";

    private readonly code: string;

    private constructor(code: string) {
        this.code = code;
    }

    /**
     * From a page's (or layout's) `properties.language`, or an API param: its language code,
     * or `"default"` without one.
     */
    static from(language: unknown): GlobalComponentLanguage {
        return GlobalComponentLanguage.isCode(language)
            ? new GlobalComponentLanguage(language)
            : GlobalComponentLanguage.default();
    }

    /**
     * From a stored record. Records stored with no language (before `"default"`) give `null`: they are ignored.
     */
    static fromStored(language: unknown): GlobalComponentLanguage | null {
        return GlobalComponentLanguage.isCode(language)
            ? new GlobalComponentLanguage(language)
            : null;
    }

    /**
     * The reason a sent language is invalid, or `null`. No language (`null` or `undefined`) means the default;
     * anything else must be a language code: a non-empty string.
     */
    static validate(language: unknown): string | null {
        if (
            language === null ||
            language === undefined ||
            GlobalComponentLanguage.isCode(language)
        ) {
            return null;
        }

        return "`language` must be a language code, or `default` for pages without a language.";
    }

    static default(): GlobalComponentLanguage {
        return new GlobalComponentLanguage(GlobalComponentLanguage.DEFAULT);
    }

    private static isCode(language: unknown): language is string {
        return typeof language === "string" && language.length > 0;
    }

    isDefault(): boolean {
        return this.code === GlobalComponentLanguage.DEFAULT;
    }

    equals(other: GlobalComponentLanguage | string | null | undefined): boolean {
        if (other === null || other === undefined) {
            return false;
        }

        return other.toString() === this.code;
    }

    toString(): string {
        return this.code;
    }
}
