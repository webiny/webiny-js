// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import type { FileBrowserFile } from "webiny-ui/FileBrowser";
import { app } from "webiny-app";
import invariant from "invariant";

type WithFileUploadOptions = {
    multiple?: boolean
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
            withProps(props => {
                return {
                    ...props,
                    onChange: async file => {
                        const withFileUploadPlugin = app.config.components.withFileUploadPlugin;
                        invariant(
                            withFileUploadPlugin,
                            `Plugin not defined for "withFileUpload component. 
                            Make sure set the plugin in app's config ("app.config.components.withFileUploadPlugin").`
                        );

                        const { onChange } = props;
                        onChange && await onChange(file);

                        if (options.multiple) {
                            Array.isArray(file) &&
                                file.forEach((current, index) => {
                                    if (mustUpload(current)) {
                                        withFileUploadPlugin.upload(current).then(async uploadedFile => {
                                            file[index] = uploadedFile;
                                            onChange && await onChange(file);
                                        });
                                    }
                                });
                            return;
                        }

                        if (mustUpload(file)) {
                            // Send file to server and get its path.
                            try {
                                withFileUploadPlugin.upload(file).then(async uploadedFile => {
                                    onChange && await onChange(uploadedFile);
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
