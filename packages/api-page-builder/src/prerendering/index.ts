import { PrerenderingPagePluginImpl } from "./page";
import prerenderingHookPlugins from "./hooks";
/**
 * We need to hook up the prerendering to our app.
 */
export default () => {
    return [new PrerenderingPagePluginImpl(), ...prerenderingHookPlugins()];
};
