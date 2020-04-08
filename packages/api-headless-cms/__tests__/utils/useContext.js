import { setupContext } from "@webiny/graphql/testing";

export default plugins => async contextPlugins => {
    return await setupContext([...plugins, ...contextPlugins]);
};
