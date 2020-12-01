import { setContext } from "apollo-link-context";
import { plugins } from "@webiny/plugins";

export default () => {
    return setContext(async (request, context) => {
        const contextPlugins = plugins.byType("apollo-link-context");
        for (let i = 0; i < contextPlugins.length; i++) {
            const newContext = await contextPlugins[i].setContext(request, context);
            context = { ...context, ...newContext };
        }
        return context;
    });
};
