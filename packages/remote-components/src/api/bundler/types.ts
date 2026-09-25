export type { ComponentSource, BundledComponent } from "~/shared/bundler/types.js";

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
