import { createAcoContext } from "~/createAcoContext";
import { createAcoFields } from "~/createAcoFields";
import { createAcoGraphQL } from "~/createAcoGraphQL";
import { createFields } from "~/fields";

export { SEARCH_RECORD_MODEL_ID } from "./record/record.model";
export { FOLDER_MODEL_ID } from "./folder/folder.model";
export { FILTER_MODEL_ID } from "./filter/filter.model";
export * from "./apps";
export * from "./plugins";

export const createAco = () => {
    return [...createFields(), createAcoContext(), ...createAcoFields(), ...createAcoGraphQL()];
};
