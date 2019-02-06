// @flow
import type { FileBrowserFile } from "webiny-ui/FileBrowser";
import type { WithFileUploadPlugin } from "webiny-app/types";

const fileUploadPlugin: WithFileUploadPlugin = {
    type: "with-file-upload",
    name: "with-file-upload",
    upload: async (file: FileBrowserFile, config: { uri: string }) => {
        return new Promise(resolve => {
            const xhr = new window.XMLHttpRequest(); // eslint-disable-line
            xhr.open("POST", config.uri, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(file));
            xhr.onload = function() {
                resolve(JSON.parse(this.responseText));
            };
        });
    }
};

export default fileUploadPlugin;
