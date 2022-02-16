import React from "react";
import * as Ui from "@webiny/ui/ImageUpload";
import { Image } from "@webiny/app/components";
import { ApwMediaFile } from "~/types";
import { createRenderImagePreview, imagePlugins } from "./utils";

const imageContainerStyle = { width: 184, height: 187 };

const imagePreviewProps = {
    transform: { width: 300 },
    style: { width: "100%", height: 232, objectFit: "cover" }
};

const changeRequestImagePreviewProps = {
    transform: { width: 300 },
    style: { width: "100%", height: "100%", objectFit: "contain" }
};

const defaultStyles = {
    width: "100%",
    height: "auto"
};

interface ApwFileProps {
    value: ApwMediaFile;
    onChange: Function;
    showFileManager: Function;
}

export const DefaultRenderImagePreview = renderImageProps => (
    <Image {...renderImageProps} {...changeRequestImagePreviewProps} />
);

export const ApwFile: React.FC<ApwFileProps> = props => {
    const { value, onChange, showFileManager } = props;

    const removeImage = () => onChange(null);

    const isImage = React.useCallback(url => {
        return imagePlugins.some(extension => url.includes(extension));
    }, []);

    const defaultRenderImagePreview = renderImageProps => (
        <Image {...renderImageProps} {...imagePreviewProps} />
    );

    const renderImagePreview = value => {
        if (value && !isImage(value.src)) {
            return createRenderImagePreview({ value, imagePreviewProps });
        }

        return defaultRenderImagePreview;
    };
    return (
        <Ui.Image
            renderImagePreview={renderImagePreview(value)}
            value={value}
            uploadImage={showFileManager}
            removeImage={removeImage}
            placeholder={`Select Image`}
            containerStyle={imageContainerStyle}
            style={defaultStyles}
        />
    );
};
