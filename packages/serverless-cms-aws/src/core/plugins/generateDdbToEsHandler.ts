import { generateHandlers } from "~/utils/generateHandlers";

export const generateDdbToEsHandler = generateHandlers("ddb-es", "core", [["dynamoToElastic"]]);
