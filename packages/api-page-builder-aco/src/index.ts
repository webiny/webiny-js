import { createPageBuilderAcoContext } from "~/plugins/context";
import { createHooks } from "~/plugins/hooks";
import { createProcessors } from "~/plugins/processors";

export const pageBuilderAcoPlugins = () => {
    return [createPageBuilderAcoContext(), createHooks(), createProcessors()];
};
