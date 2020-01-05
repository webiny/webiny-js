import ssrApi from "./ssrApi";
import ssrServe from "./ssrServe";
import models from "./models";

const defaultOptions = {
    ssrFunction: process.env.SSR_FUNCTION,
    ssrCacheTtl: 8000,
    ssrCacheTtlState: 20
};

export default rawOptions => {
    const options = { ...defaultOptions, ...rawOptions };
    return [models(options), ssrServe(options), ssrApi(options)];
};
