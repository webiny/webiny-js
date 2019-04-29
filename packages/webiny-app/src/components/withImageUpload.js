// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { withFileUpload } from "./withFileUpload";

type WithImageUploadOptions = {
    multiple?: boolean
};

// Image flickering issue - once the image was uploaded, the data URL is switched with the actual path, which makes
// the image flicker.
// It is hard to know when the uploaded image was loaded in the actual image component. Sure, we have the URL to the
// image in the "onChange" callback, but the problem is that a "transform" could be applied on the Image component, which
// is represented by a different URL, which cannot be accessed here.
// In the end, we decided to just wait for a second after the upload has finished, which should
// give some time for the actual image to load, and should prevent the image flickering a bit.
const waitASecond = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });
};

export const withImageUpload = (options: WithImageUploadOptions = {}): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
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
                                    current &&
                                        typeof current.src === "string" &&
                                        !current.src.startsWith("data:") &&
                                        (await waitASecond(current));
                                }
                                await onChange(file);
                            }
                            return;
                        }

                        // Single image.
                        if (file && typeof file.src === "string" && !file.src.startsWith("data:")) {
                            await waitASecond(file);
                        }
                        await onChange(file);
                    }
                };
            }),
            withFileUpload(options)
        )(BaseComponent);
    };
};
