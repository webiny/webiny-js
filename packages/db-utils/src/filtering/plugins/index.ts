import { createDefaultFilterCreate } from "./defaultFilterCreate.js";
import { createRefFilterCreate } from "./refFilterCreate.js";
import { objectFilterCreate } from "./objectFilterCreate.js";
import { searchableJsonFilterCreate } from "./searchableJsonFilterCreate.js";

export const createFilterCreatePlugins = () => {
    return [
        createDefaultFilterCreate(),
        createRefFilterCreate(),
        objectFilterCreate(),
        searchableJsonFilterCreate()
    ];
};
