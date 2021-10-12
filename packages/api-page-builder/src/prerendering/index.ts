import { prerenderingHandlers } from "./prerenderingHandlers";
import prerenderingHookPlugins from "./hooks";

export default () => {
    return [prerenderingHandlers, ...prerenderingHookPlugins()];
};
