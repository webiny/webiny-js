// @flow
import * as plugins from "./plugins";
import { type FilesServicePlugin } from "./types";

// Loads appropriate file storage plugin.
export default (): FilesServicePlugin => {
    const plugin: ?string = process.env.PLUGIN;
    if (!plugin || !plugins[plugin]) {
        throw new Error(`Files plugin not found`);
    }
    return plugins[plugin];
};
