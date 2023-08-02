import React from "react";
import { Admin, Decorator } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { FileManagerViewConfig, useFile } from "@webiny/app-file-manager";
import "./App.scss";

const { Browser, FileDetails } = FileManagerViewConfig;

const VideoThumbnail: Decorator = Original => {
    return function VideoThumbnail() {
        const { file } = useFile();

        const thumbnail = file.extensions?.carMake;
        if (file.type.startsWith("video/") && thumbnail) {
            return <img src={thumbnail} />;
        }

        return <Original />;
    };
};

const BrowserVideoThumbnail = Browser.Thumbnail.createDecorator(VideoThumbnail);
const FileDetailsVideoThumbnail = FileDetails.Thumbnail.createDecorator(VideoThumbnail);

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <FileManagerViewConfig>
                <BrowserVideoThumbnail />
                <FileDetailsVideoThumbnail />
            </FileManagerViewConfig>
        </Admin>
    );
};
