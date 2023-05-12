import { createDefaultFilterCreate } from "./defaultFilterCreate";
import { createRefFilterCreate } from "./refFilterCreate";
import { objectFilterCreate } from "./objectFilterCreate";

export const createFilterCreatePlugins = () => {
    return [createDefaultFilterCreate(), createRefFilterCreate(), objectFilterCreate()];
};
