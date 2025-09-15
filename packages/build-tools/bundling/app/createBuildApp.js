export const createBuildApp = config => async options => {
    //eslint-disable-next-line import/dynamic-import-chunkname
    const { prepareOptions } = await import("../../utils.js");
    //eslint-disable-next-line import/dynamic-import-chunkname
    const { applyDefaults } = await import("./utils.js");
    //eslint-disable-next-line import/dynamic-import-chunkname
    const { AppBundler } = await import("./bundlers/AppBundler.js");

    applyDefaults();
    const preparedOptions = prepareOptions({ config, options });
    const bundler = new AppBundler(preparedOptions);

    return bundler.build();
};
