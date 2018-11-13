// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { withConfig } from "webiny-app/components";
import { withFileUpload } from "./withFileUpload";

type WithImageUploadOptions = {
    multiple?: boolean
};

const fetchImage = file => {
    return new Promise(resolve => {
        const image = new window.Image();
        image.onload = async () => {
            resolve();
        };
        image.src = file.src;
    });
};

export const withImageUpload = (options: WithImageUploadOptions = {}): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
            withConfig(),
            withProps(props => {
                return {
                    ...props,
                    onChange: async file => {
                        const { onChange } = props;
                        if (!onChange) {
                            return;
                        }

                        // Multiple images.
                        if (options.multiple) {
                            if (Array.isArray(file)) {
                                for (let index = 0; index < file.length; index++) {
                                    let current = file[index];
                                    current.src.startsWith("http") && (await fetchImage(current));
                                }
                                await onChange(file);
                            }
                            return;
                        }

                        // Single image.
                        if (file && file.src.startsWith("http")) {
                            await fetchImage(file);
                        }
                        await onChange(file);
                    }
                };
            }),
            withFileUpload(options)
        )(BaseComponent);
    };
};
