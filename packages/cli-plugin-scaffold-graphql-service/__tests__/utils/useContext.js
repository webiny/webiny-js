import { setupContext } from "@webiny/graphql/testing";

export default plugins => async (contextPlugins = [], baseContext = {}) => {
    return await setupContext([...plugins, ...contextPlugins], baseContext);
};
