import { ContextPlugin } from "@webiny/handler/Context";
import { Context } from "~/types";
import { createLockingMechanismCrud } from "~/crud/crud";

export const createContext = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        context.lockingMechanism = createLockingMechanismCrud({
            context
        });
    });

    plugin.name = "headlessCms.context.lockingMechanism";

    return plugin;
};
