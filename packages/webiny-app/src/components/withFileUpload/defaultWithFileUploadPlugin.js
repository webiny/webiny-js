// @flow
import type { FileBrowserFile } from "webiny-ui/FileBrowser";
import type { WithFileUploadPlugin } from "./types";

/**
 * A simple local storage plugin, used with "withFileUpload" HOC.
 * When using this, make sure server side is also configured in the same way.
 * Can be used for development purposes only.
 */

type DefaultWithFileUploadPluginConfig = {
    uri: string
};

const defaultWithFileUploadPlugin: (
    config: DefaultWithFileUploadPluginConfig
) => WithFileUploadPlugin = config => {
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

export default defaultWithFileUploadPlugin;
