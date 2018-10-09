// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import type { FileBrowserFile } from "webiny-ui/FileBrowser";
import { withAppConfig } from "webiny-app/components";
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
            withAppConfig(),
            withProps(props => {
                return {
                    ...props,
                    onChange: async file => {
                        const withFileUploadPlugin =
                            props.config.withFileUpload && props.config.withFileUpload.plugin;
                        invariant(
                            withFileUploadPlugin,
                            `Plugin not defined for "withFileUpload component. 
                            Make sure set the plugin in app's config ("app.config.components.withFileUploadPlugin").`
                        );

                        const { onChange } = props;
                        onChange && (await onChange(file));

                        if (options.multiple) {
                            if (Array.isArray(file)) {
                                for (let index = 0; index < file.length; index++) {
                                    let current = file[index];
                                    if (mustUpload(current)) {
                                        file[index] = await withFileUploadPlugin.upload(current);
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
                                    .upload(file)
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
