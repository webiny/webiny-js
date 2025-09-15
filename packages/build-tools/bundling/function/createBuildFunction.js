import { prepareOptions } from "../../utils.js";

export const createBuildFunction = config => async options => {
    const preparedOptions = prepareOptions({ config, options });
    //eslint-disable-next-line import/dynamic-import-chunkname
    const { FunctionBundler } = await import("./bundlers/FunctionBundler.js");
    const bundler = new FunctionBundler(preparedOptions);
    return bundler.build();
};
