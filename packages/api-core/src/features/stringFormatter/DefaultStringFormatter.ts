import { Slugify } from "~/features/slugify/abstractions.js";
import { StringFormatter } from "./abstractions.js";

/**
 * The string formatter is the consumer-facing API for string transforms. It keeps each transform's
 * logic in its own fine-grained, decoratable feature (e.g. `Slugify`) and just delegates to it, so a
 * project can change one transform without reimplementing the whole formatter. More methods will be
 * added here over time.
 */
class DefaultStringFormatterImpl implements StringFormatter.Interface {
    constructor(private readonly slugifier: Slugify.Interface) {}

    slugify(value: string): string {
        return this.slugifier.execute(value);
    }
}

export const DefaultStringFormatter = StringFormatter.createImplementation({
    implementation: DefaultStringFormatterImpl,
    dependencies: [Slugify]
});
