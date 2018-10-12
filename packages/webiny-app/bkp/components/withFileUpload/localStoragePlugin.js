// @flow
import type { FileBrowserFile } from "webiny-ui/FileBrowser";

/**
 * A simple local storage plugin, used with "withFileUpload" HOC.
 * When using this, make sure server side is also configured in the same way.
 * Can be used for development purposes only.
 */

type LocalStoragePluginConfig = {
    uri: string
};

export default (config: LocalStoragePluginConfig) => {
    return {
        upload: async (file: FileBrowserFile) => {
            return new Promise(resolve => {
                const xhr = new window.XMLHttpRequest();
                xhr.open("POST", config.uri, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.send(JSON.stringify(file));
                xhr.onload = function() {
                    resolve(JSON.parse(this.responseText));
                };
            });
        }
    };
};
