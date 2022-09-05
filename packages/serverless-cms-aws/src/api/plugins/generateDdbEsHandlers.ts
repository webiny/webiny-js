import { HANDLERS_PATHS } from "./handlersPaths";
import { generateHandlers } from "~/utils/generateHandlers";

export const generateDdbEsHandlers = generateHandlers("ddb-es", "api", HANDLERS_PATHS);
