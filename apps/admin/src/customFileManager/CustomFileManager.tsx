// @ts-nocheck
import React, { useEffect, useState } from "react";
import { createComponentPlugin } from "@webiny/app-serverless-cms";
import { FileManagerRenderer, OverlayLayout } from "@webiny/app-admin";
import { CircularProgress } from "@webiny/ui/Progress";

/**
 * Create a plugin for the composable component `FileManagerRenderer`.
 */
export const CustomFileManager = createComponentPlugin(FileManagerRenderer, () => {
    return function FileManagerRenderer(props) {
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            window.mediaLibrary = cloudinary.createMediaLibrary(
                {
                    cloud_name: "dmpzz5qoz",
                    api_key: "687398841657945",
                    remove_header: true,
                    insert_caption: "Insert",
                    inline_container: "#cloudinary",
                    default_transformations: [[]]
                },
                {
                    showHandler: () => {
                        setLoading(false);
                    },
                    insertHandler: function (data) {
                        if (!props.onChange) {
                            props.onClose();
                            return;
                        }

                        const files = data.assets.map(asset => ({
                            id: asset.public_id,
                            src: asset.secure_url
                        }));

                        if (props.multiple) {
                            props.onChange(files);
                        } else {
                            props.onChange(files[0]);
                        }

                        props.onClose && props.onClose();
                    }
                }
            );

            mediaLibrary.show({
                multiple: props.multiple ?? false
            });
        }, []);

        /**
         * For this example, we use the `OverlayLayout` component, which renders a full screen overlay,
         * just like we have in our default renderer. You could render a modal dialog, or any kind of popup dialog according to your needs.
         */
        return (
            <OverlayLayout onExited={() => props.onClose && props.onClose()}>
                <div id={"cloudinary"} style={{ height: "calc(100vh - 70px)" }}>
                    {loading ? <CircularProgress label={"Loading media library..."} /> : null}
                </div>
            </OverlayLayout>
        );
    };
});
