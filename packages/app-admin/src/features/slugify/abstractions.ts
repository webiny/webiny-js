import { createAbstraction } from "@webiny/feature/admin";

export interface ISlugify {
    /**
     * Turns a value into a URL-friendly slug using Webiny's canonical options. This is the
     * fine-grained seam behind `StringFormatter.slugify()` — decorate `Slugify` alone to change slug
     * logic without touching the rest of the string formatter.
     */
    execute(value: string): string;
}

export const Slugify = createAbstraction<ISlugify>("Slugify");

export namespace Slugify {
    export type Interface = ISlugify;
}
