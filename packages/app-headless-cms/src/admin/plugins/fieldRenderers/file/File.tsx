import React, { useCallback } from "react";
import { Image } from "@webiny/app/components";
import * as Ui from "@webiny/ui/ImageUpload";
import { createRenderImagePreview, imagePlugins } from "./utils";
import fileIcon from "../../fields/icons/round_insert_drive_file-24px.svg";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const imagePreviewProps = {
    transform: { width: 300 },
    style: { width: "100%", height: 232, objectFit: "cover" }
};

const defaultStyles = {
    width: "100%",
    height: "auto"
};

const defaultValidation = {
    isValid: null,
    message: null
};

export interface Props {
    url: string;
    onRemove: Function;
    placeholder: string;
    styles?: Record<string, any>;
    showFileManager?: Function;
    validation?: {
        isValid?: boolean;
        message?: string;
    };
    description?: string;
}
const File: React.FunctionComponent<Props> = props => {
    const { url, onRemove, placeholder, showFileManager, description } = props;

    const styles = props.styles || defaultStyles;
    const validation = props.validation || defaultValidation;

    const isImage = useCallback(url => {
        return imagePlugins.some(extension => url.includes(extension));
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
        <>
            <Ui.Image
                renderImagePreview={renderImagePreview(url)}
                style={styles}
                value={url ? { src: getImageSrc(url) } : null}
                uploadImage={showFileManager}
                removeImage={onRemove}
                placeholder={placeholder}
                containerStyle={{ height: "auto" }}
            />
            {validation.isValid === false && (
                <FormElementMessage error>
                    {validation.message || "Invalid value."}
                </FormElementMessage>
            )}
            {validation.isValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </>
    );
};

export default File;
