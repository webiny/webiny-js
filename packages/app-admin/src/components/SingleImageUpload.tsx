import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import * as Ui from "@webiny/ui/ImageUpload";
import { FileManager } from "./FileManager";
import { FormComponentProps } from "@webiny/ui/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import styled from "@emotion/styled";

const ImageUploadWrapper = styled("div")({
    position: "relative",
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    ".mdc-floating-label--float-above": {
        transform: "scale(0.75)",
        top: 10,
        left: 10,
        color: "var(--mdc-theme-text-secondary-on-background)"
    },
    ".mdc-text-field-helper-text": {
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

export interface SingleImageUploadProps extends FormComponentProps {
    // Accept types
    accept?: string[];

    // Component label.
    label?: string;

    // Is component disabled?
    disabled?: boolean;

    // Description beneath the image.
    description?: React.ReactNode;

    // A className for the root element.
    className?: string;

    // Define file's max allowed size (default is "10mb").
    // Uses "bytes" (https://www.npmjs.com/package/bytes) library to convert string notation to actual number.
    maxSize?: number | string;

    // Max number of files in a single batch.
    multipleMaxCount?: number;

    // Max size of files in a single batch.
    multipleMaxSize?: number | string;

    // onChange callback.
    onChange?: (value: any) => void;

    // Optional custom props, passed to the preview image.
    imagePreviewProps?: any;

    // Is the wrapper round?
    round?: boolean;

    // Define the needed properties that are returned on file(s) selection.
    onChangePick?: string[];
}

export default class SingleImageUpload extends React.Component<SingleImageUploadProps> {
    render() {
        const {
            className,
            onChange,
            value,
            validation,
            label,
            description,
            accept,
            onChangePick,
            maxSize,
            multipleMaxCount,
            multipleMaxSize,
            imagePreviewProps,
            round
        } = this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <ImageUploadWrapper className={className}>
                {label && (
                    <div className="mdc-floating-label mdc-floating-label--float-above">
                        {label}
                    </div>
                )}

                <FileManager
                    onChange={onChange}
                    onChangePick={onChangePick}
                    accept={accept}
                    images={!accept}
                    maxSize={maxSize}
                    multipleMaxCount={multipleMaxCount}
                    multipleMaxSize={multipleMaxSize}
                >
                    {({ showFileManager }) => (
                        <Ui.Image
                            renderImagePreview={renderImageProps => (
                                <Image {...renderImageProps} {...imagePreviewProps} />
                            )}
                            style={{ width: "100%", height: "auto" }}
                            value={value}
                            uploadImage={showFileManager}
                            removeImage={onChange}
                            round={round}
                        />
                    )}
                </FileManager>

                {validationIsValid === false && (
                    <FormElementMessage error>{validationMessage}</FormElementMessage>
                )}
                {validationIsValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </ImageUploadWrapper>
        );
    }
}
