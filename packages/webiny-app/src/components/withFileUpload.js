// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import type { FileBrowserFile } from "webiny-ui/FileBrowser";
import { withConfig } from "webiny-app/components";
import { getPlugin } from "webiny-app/plugins";
import invariant from "invariant";
import type { Plugin } from "webiny-app/types";
import _ from "lodash";

type WithFileUploadOptions = {
    multiple?: boolean
};

export type WithFileUploadPlugin = Plugin & {
    type: "with-file-upload",
    upload: (file: FileBrowserFile, options: Object) => Promise<any>
};

export type FileUploadSuccess = FileBrowserFile & {
    // Nothing for now, probably won't be anything here.
};

export type FileUploadError = {
    // TODO - still no unified error messaging on the API side.
};

const mustUpload = (file: FileBrowserFile) => {
    if (!file) {
        return false;
    }

    const src: string = (file.src: any);
    return src.startsWith("data:");
};

export const withFileUpload = (options: WithFileUploadOptions = {}): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
            withConfig(),
            withProps(props => {
                return {
                    ...props,
                    onChange: async file => {
                        const config = _.get(props.config, "components.withFileUpload");
                        invariant(config, "withFileUpload component's configuration not found.");

                        invariant(
                            config.plugin || !Array.isArray(config.plugin),
                            `"withFileUpload" component's plugin not set. 
                            Please configure it properly via app config ("components.withFileUpload.plugin").`
                        );

                        const [plugin, params] = config.plugin;
                        const withFileUploadPlugin = getPlugin(plugin);

                        invariant(
                            withFileUploadPlugin,
                            `"withFileUpload" component's plugin (set to "${plugin}") not found.`
                        );

                        const { onChange } = props;
                        onChange && (await onChange(file));

                        if (options.multiple) {
                            if (Array.isArray(file)) {
                                for (let index = 0; index < file.length; index++) {
                                    let current = file[index];
                                    if (mustUpload(current)) {
                                        file[index] = await withFileUploadPlugin.upload(
                                            current,
                                            params
                                        );
                                        onChange && (await onChange(file));
                                    }
                                }
                            }
                            return;
                        }

                        invariant(
                            !Array.isArray(file),
                            `Selected two or more files instead of one. Did you forget to set "multiple" option to true ("withFileUpload({multiple: true})")?`
                        );

                        if (mustUpload(file)) {
                            // Send file to server and get its path.
                            try {
                                return withFileUploadPlugin
                                    .upload(file, params)
                                    .then(async uploadedFile => {
                                        onChange && (await onChange(uploadedFile));
                                    });
                            } catch (e) {
                                console.warn(e);
                            }
                        }
                    }
                };
            })
        )(BaseComponent);
    };
};
