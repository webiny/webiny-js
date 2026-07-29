import { useFeature } from "@webiny/app";
import { DateFormatterFeature } from "./feature.js";

/**
 * Resolves the shared DateFormatter for components that have no presenter of their own. Prefer
 * formatting in a presenter's view model where one exists.
 */
export function useDateFormatter() {
    return useFeature(DateFormatterFeature).formatter;
}
