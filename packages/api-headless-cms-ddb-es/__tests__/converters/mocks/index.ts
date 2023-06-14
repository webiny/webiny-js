import { createModel } from "./model";
import { createGroup } from "./group";

export const createMockPlugins = () => {
    return [createGroup(), createModel()];
};
