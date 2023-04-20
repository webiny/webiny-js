import { createAdminSettingsContext } from "@webiny/api-admin-settings";

import { createAcoContext } from "~/createAcoContext";
import { createAcoFields } from "~/createAcoFields";
import { createAcoGraphQL } from "~/createAcoGraphQL";

export { SEARCH_RECORD_MODEL_ID } from "./record/record.model";
export { FOLDER_MODEL_ID } from "./folder/folder.model";

export const createAco = () => {
    return [
        ...createAdminSettingsContext(),
        createAcoContext(),
        createAcoFields(),
        createAcoGraphQL()
    ];
};
