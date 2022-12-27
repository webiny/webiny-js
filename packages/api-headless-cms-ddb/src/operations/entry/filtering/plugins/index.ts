import { createDefaultFilterCreate } from "./defaultFilterCreate";
import { createRefFilterCreate } from "./refFilterCreate";

export const createFilterCreatePlugins = () => {
    return [createDefaultFilterCreate(), createRefFilterCreate()];
};
