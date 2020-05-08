import { setupSchema } from "@webiny/graphql/testing";

export default plugins => async (contextPlugins = []) => {
    return await setupSchema([...plugins, ...contextPlugins]);
};
