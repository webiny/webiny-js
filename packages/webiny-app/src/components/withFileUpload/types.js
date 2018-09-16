// @flow
import type { Plugin } from "webiny-app/types";
import type { FileBrowserFile } from "webiny-ui/FileBrowser";

export type WithFileUploadPlugin = Plugin & {
    upload: (file: FileBrowserFile) => Promise<any>
};

export type FileUploadSuccess = FileBrowserFile & {
    // Nothing for now, probably won't be anything here.
};

export type FileUploadError = {
    // TODO - still no unified error messaging on the API side.
};
