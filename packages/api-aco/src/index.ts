import { createAcoContext } from "~/createAcoContext.js";
import { createAcoGraphQL } from "~/createAcoGraphQL.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createAcoTasks } from "~/createAcoTasks.js";

export { FOLDER_MODEL_ID } from "./folder/folder.model.js";
export { FILTER_MODEL_ID } from "./filter/filter.model.js";

export interface CreateAcoParams {
    documentClient: DynamoDBDocument;
    useFolderLevelPermissions?: boolean;
}

export const createAco = (params: CreateAcoParams) => {
    return [createAcoContext(params), ...createAcoGraphQL(), ...createAcoTasks()];
};

export * from "./folder/createFolderModelModifier.js";
