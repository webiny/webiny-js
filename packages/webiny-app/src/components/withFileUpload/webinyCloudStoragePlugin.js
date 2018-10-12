// @flow
import type { FileBrowserFile } from "webiny-ui/FileBrowser";

/**
 * TODO: when we get to webiny cloud development.
 * A simple S3 storage plugin, used with "withFileUpload" HOC.
 * When using this, make sure server side is also configured in the same way.
 * Can be used for production.
 *
 * How it works?
 * First it sends file data to the server, which then returns a signed URL, to be used for actual upload to S3.
 * Once the upload is complete, another request will be sent to the server, to confirm that the file was uploaded.
 */

type WebinyCloudStoragePluginConfig = {
    siteToken: string // Just a sample config param, remove this if needed.
};

export default (config: WebinyCloudStoragePluginConfig) => {
    return {
        upload: async (file: FileBrowserFile) => {
            return new Promise((resolve, reject) => {
                dispatch(
                    typeSave({
                        fields: "name src type size",
                        type: "Files",
                        data: file,
                        onSuccess: (response: FileBrowserFile) => {
                            // TODO: upload to S3 with a signed URL.
                            // TODO: tell the server that the file upload is done or report errors if any.
                            resolve(response);
                        },
                        onError: errors => {
                            console.log(config.siteToken); // Just a sample, remove this if needed.
                            // Failed to receive S3 signed upload URL?
                            reject(errors);
                        }
                    })
                );
            });
        }
    };
};
