import React, { useCallback } from "react";
import { Admin, createComponentPlugin } from "@webiny/app-serverless-cms";
import { FileManagerFileItem, FileManagerRenderer, OverlayLayout } from "@webiny/app-admin";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { Extensions } from "./Extensions";
import "./App.scss";

const CustomFileManager = createComponentPlugin(FileManagerRenderer, () => {
    return function FileManagerRenderer(props) {
        const setRandomImage = useCallback(() => {
            const image: FileManagerFileItem = {
                id: "866",
                src: "https://picsum.photos/200",
                meta: [{ key: "source", value: "https://picsum.photos/" }]
            };

            if (props.multiple) {
                props.onChange && props.onChange([image]);
            } else {
                props.onChange && props.onChange(image);
            }
            props.onClose && props.onClose();
        }, []);

        return (
            <OverlayLayout onExited={() => props.onClose && props.onClose()}>
                <button onClick={setRandomImage}>Set a random image</button>
                {/* @ts-expect-error */}
                <input type={"file"} accept={["image/jpeg"]} />
            </OverlayLayout>
        );
    };
});

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <CustomFileManager />
            <Extensions />
        </Admin>
    );
};
