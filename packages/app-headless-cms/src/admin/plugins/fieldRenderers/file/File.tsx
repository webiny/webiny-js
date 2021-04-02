import React, { useCallback } from "react";
import { Image } from "@webiny/app/components";
import * as Ui from "@webiny/ui/ImageUpload";
import { createRenderImagePreview, imageExtensions } from "./utils";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";

const imagePreviewProps = {
    transform: { width: 300 },
    style: { width: "100%", height: 232, objectFit: "cover" }
};

function File(props) {
    const { url, onRemove, placeholder, styles, showFileManager } = props;

    const isImage = useCallback(url => {
        return imageExtensions.some(extension => url.includes(extension));
    }, []);

    const getImageSrc = useCallback(url => {
        if (url && isImage(url)) {
            return url;
        }
        return fileIcon;
    }, []);

    const defaultRenderImagePreview = renderImageProps => (
        <Image {...renderImageProps} {...imagePreviewProps} />
    );

    const renderImagePreview = url => {
        if (url && !isImage(url)) {
            return createRenderImagePreview({ value: url, imagePreviewProps });
        }

        return defaultRenderImagePreview;
    };

    return (
        <Ui.Image
            renderImagePreview={renderImagePreview(url)}
            style={styles}
            value={url ? { src: getImageSrc(url) } : null}
            uploadImage={showFileManager}
            removeImage={onRemove}
            placeholder={placeholder}
            containerStyle={{ height: "auto" }}
        />
    );
}

File.defaultProps = {
    validation: { isValid: null },
    styles: { width: "100%", height: "auto" }
};

export default File;
