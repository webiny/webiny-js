import { Masker } from "./abstractions.js";

class MaskerImpl implements Masker.Interface {
    mask(value: string): string {
        if (value.length <= 8) {
            return "\u2022".repeat(value.length);
        }

        const prefix = value.slice(0, 8);
        const suffix = value.slice(-4);
        return `${prefix}${"\u2022".repeat(12)}${suffix}`;
    }
}

export default Masker.createImplementation({
    implementation: MaskerImpl,
    dependencies: []
});
