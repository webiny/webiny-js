import { handler as ddbHandler } from "@webiny/project-ddb/handlers/api";

// Import from user's project.
import apiPlugins from "../../../../../plugins/api";

export const handler = ddbHandler(apiPlugins);
