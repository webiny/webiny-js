import { createAbstraction } from "@webiny/feature/api";

export interface IStringFormatter {
    /**
     * Turns a value into a URL-friendly slug. Delegates to the `Slugify` feature, so to change slug
     * logic decorate `Slugify` alone rather than the whole string formatter.
     */
    slugify(value: string): string;
}

export const StringFormatter = createAbstraction<IStringFormatter>("StringFormatter");

export namespace StringFormatter {
    export type Interface = IStringFormatter;
}
