import { Masker } from "./abstractions.js";

class MaskerImpl implements Masker.Interface {
    mask(value: string, pattern?: number[]): string {
        if (!pattern) {
            return "●".repeat(value.length);
        }

        const [start = 0, end = 0] = pattern;
        if (start + end >= value.length) {
            return "●".repeat(12);
        }

        const prefix = value.slice(0, start);
        const suffix = end > 0 ? value.slice(-end) : "";
        return `${prefix}${"●".repeat(12)}${suffix}`;
    }
}

export default Masker.createImplementation({
    implementation: MaskerImpl,
    dependencies: []
});
