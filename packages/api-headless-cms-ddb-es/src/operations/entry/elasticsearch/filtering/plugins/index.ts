import { createDefaultFilterPlugin } from "./defaultFilterPlugin";
import { createObjectFilterPlugin } from "./objectFilterPlugin";
import { createRefFilterPlugin } from "./refFilterPlugin";

export const createFilterPlugins = () => {
    return [createDefaultFilterPlugin(), createObjectFilterPlugin(), createRefFilterPlugin()];
};
