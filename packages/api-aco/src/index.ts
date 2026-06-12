import { createAcoContext } from "~/createAcoContext.js";
import { createAcoGraphQL } from "~/createAcoGraphQL.js";
import { createAcoTasks } from "~/createAcoTasks.js";

export { FILTER_MODEL_ID } from "./filter/filter.model.js";

export const createAco = () => {
    return [createAcoContext(), ...createAcoGraphQL(), createAcoTasks()];
};

export * from "./folder/createFolderModelModifier.js";
