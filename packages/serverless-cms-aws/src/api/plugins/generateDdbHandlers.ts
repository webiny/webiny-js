import { HANDLERS_PATHS } from "./handlersPaths";
import { generateHandlers } from "~/utils/generateHandlers";

export const generateDdbHandlers = generateHandlers("ddb", "api", HANDLERS_PATHS);
