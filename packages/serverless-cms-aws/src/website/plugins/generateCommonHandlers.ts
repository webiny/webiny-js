import { generateHandlers } from "~/utils/generateHandlers";

const HANDLERS_PATHS = [
    ["prerendering", "flush"],
    ["prerendering", "render"],
    ["prerendering", "subscribe"]
];

export const generateCommonHandlers = generateHandlers("common", "website", HANDLERS_PATHS);
