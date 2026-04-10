// Languages SDK type declarations.
export const LANGUAGES_DECLARATIONS = `
interface SdkLanguage {
    /** Unique language entry ID. */
    id: string;
    /** BCP 47 language code (e.g. "en-US", "fr-FR"). */
    code: string;
    /** Human-readable language name. */
    name: string;
    /** Text direction. */
    direction?: "ltr" | "rtl";
    /** Whether this is the default language. */
    isDefault?: boolean;
}

interface SdkLanguages {
    /** List all enabled languages. */
    listLanguages(): Promise<SdkResult<SdkLanguage[], SdkError>>;
}
`;
