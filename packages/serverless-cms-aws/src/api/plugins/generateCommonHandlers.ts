import { generateHandlers } from "~/utils/generateHandlers";

const COMMON_HANDLERS_PATHS = [
    ["fileManager", "download"],
    ["fileManager", "manage"],
    ["fileManager", "transform"]
];

export const generateCommonHandlers = generateHandlers("common", "api", COMMON_HANDLERS_PATHS);
