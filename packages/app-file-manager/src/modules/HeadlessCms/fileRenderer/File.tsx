import React, { useCallback } from "react";
import { Image } from "@webiny/app/components";
import * as Ui from "@webiny/ui/ImageUpload";
import { createRenderImagePreview, imagePlugins } from "./utils";
import fileIcon from "@material-design-icons/svg/round/insert_drive_file.svg";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const imagePreviewProps = {
    transform: { width: 300 },
    style: {
        width: "100%",
        height: "100%",
        maxHeight: "160px",
        background: "repeating-conic-gradient(#efefef 0% 25%, transparent 0% 50%) 50%/25px 25px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        objectFit: "contain"
    }
};

const defaultStyles = {
    width: "100%",
    height: "auto"
};

interface ValidationStatus {
    isValid?: boolean;
    message?: string;
}
const defaultValidation: ValidationStatus = {
    isValid: undefined,
    message: undefined
};

export interface FileProps {
    url: string;
    onRemove: () => void;
    onEdit?: () => void;
    placeholder?: string;
    styles?: Record<string, any>;
    showFileManager?: () => void;
    validation?: {
        isValid?: boolean;
        message?: string;
    };
    description?: string;
}
const File = (props: FileProps) => {
    const { url, onRemove, onEdit, placeholder, showFileManager, description } = props;

    const styles = props.styles || defaultStyles;
    const validation = props.validation || defaultValidation;

    const isImage = useCallback((url: string) => {
        return imagePlugins.some(extension => url.includes(extension));
    }, []);

    const getImageSrc = useCallback((url?: string) => {
        if (url && isImage(url)) {
            return url;
        }
        return fileIcon;
    }, []);

    // TODO @ts-refactor figure out correct type
    const defaultRenderImagePreview = (renderImageProps: any) => (
        <Image {...renderImageProps} {...imagePreviewProps} />
    );

    const renderImagePreview = (url: string) => {
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
                uploadImage={() => {
                    if (!showFileManager) {
                        return;
                    }
                    showFileManager();
                }}
                removeImage={onRemove}
                editImage={onEdit}
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
