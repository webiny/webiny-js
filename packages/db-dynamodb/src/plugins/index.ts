/**
 * List everything that needs to be loaded by default.
 */
import filterPlugins from "./filters";

export default () => {
    return [filterPlugins()];
};
