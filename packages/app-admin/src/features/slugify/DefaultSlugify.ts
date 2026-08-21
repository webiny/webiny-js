import baseSlugify from "slugify";
import { Slugify } from "./abstractions.js";
import type { ISlugify } from "./abstractions.js";

/**
 * Webiny's canonical slug options. These were previously duplicated at every call site; keeping them
 * in one private place means projects can change slug generation everywhere at once by decorating
 * Slugify — not by passing per-call options, so the abstraction stays independent of this library.
 */
const DEFAULT_OPTIONS = {
    replacement: "-",
    lower: true,
    remove: /[*#?<>_{}[\]+~.()'"!:;@]/g,
    trim: false
};

class DefaultSlugifyImpl implements ISlugify {
    execute(value: string): string {
        return baseSlugify(value, DEFAULT_OPTIONS);
    }
}

export const DefaultSlugify = Slugify.createImplementation({
    implementation: DefaultSlugifyImpl,
    dependencies: []
});
