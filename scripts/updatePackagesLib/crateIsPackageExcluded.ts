import type { IPresetExclude } from "./createPreset.js";

export const crateIsPackageExcluded = (input?: IPresetExclude) => {
    return (name: string): boolean => {
        if (!input) {
            return false;
        } else if (typeof input === "string") {
            return input === name;
        } else if (Array.isArray(input)) {
            return input.includes(name);
        } else if (input instanceof RegExp) {
            return input.test(name);
        } else if (typeof input === "function") {
            return input(name);
        }
        return false;
    };
};
