import ssrCacheApi from "./ssrCacheApi";
import ssrServe from "./ssrServe";
import models from "./models";
import { withFields, boolean, number, string, fields } from "@webiny/commodo/fields";

const OptionsModel = withFields({
    ssrFunction: string({ value: process.env.SSR_FUNCTION }),
    cache: fields({
        value: {},
        instanceOf: withFields({
            enabled: boolean({ value: false }),
            ttl: number({ value: 80 }),
            staleTtl: number({ value: 20 })
        })()
    })
})();

export default rawOptions => {
    const options = new OptionsModel().populate(rawOptions);
    const plugins = [models(options), ssrServe(options)];
    if (options.cache.enabled) {
        plugins.push(ssrCacheApi());
    }
    return plugins;
};
