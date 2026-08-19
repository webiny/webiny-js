import { useFeature } from "@webiny/app";
import { StringFormatterFeature } from "./feature.js";

/**
 * Resolves the shared StringFormatter for components that have no presenter of their own. Prefer
 * formatting in a presenter where one exists.
 */
export function useStringFormatter() {
    return useFeature(StringFormatterFeature).stringFormatter;
}
