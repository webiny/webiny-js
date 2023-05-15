import { createAdminSettingsContext } from "@webiny/api-admin-settings";
import { createAcoContext } from "~/createAcoContext";
import { createAcoGraphQL } from "~/createAcoGraphQL";
import { createFields } from "~/fields";

export { SEARCH_RECORD_MODEL_ID } from "./record/record.model";
export { FOLDER_MODEL_ID } from "./folder/folder.model";

export const createAco = () => {
    return [
        ...createFields(),
        ...createAdminSettingsContext(),
        createAcoContext(),
        createAcoGraphQL()
    ];
};
