import * as React from "react";
import { Image } from "@webiny/app/components/Image";
import * as Ui from "@webiny/ui/ImageUpload";
import { FileManager } from "@webiny/app-admin/components/FileManager";
import { FormComponentProps } from "@webiny/ui/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import styled from "@emotion/styled";

const FileUploadWrapper = styled("div")({
    position: "relative",
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    ".mdc-text-field-helper-text": {
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

type FileUploadProps = FormComponentProps & {
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
    onChange?: Function;

    // Optional custom props, passed to the preview image.
    imagePreviewProps?: any;

    // Is the wrapper round?
    round?: boolean;

    // Placeholder text when hovering over file
    placeholder?: string;

    // upload multiple files
    multiple?: boolean;

    // Image wrapper styles
    styles?: object;

    // render image preview function
    renderImagePreview?: any;
};

export default class FileUpload extends React.Component<FileUploadProps> {
    static defaultProps = {
        validation: { isValid: null },
        styles: { width: "100%", height: "auto" }
    };

    render() {
        const {
            className,
            onChange,
            value,
            validation,
            description,
            accept,
            maxSize,
            multipleMaxCount,
            multipleMaxSize,
            imagePreviewProps,
            round,
            multiple,
            placeholder,
            styles,
            renderImagePreview
        } = this.props;

        const defaultRenderImagePreview = renderImageProps => (
            <Image {...renderImageProps} {...imagePreviewProps} />
        );

        return (
            <FileUploadWrapper className={className}>
                <FileManager
                    onChange={onChange}
                    accept={accept}
                    maxSize={maxSize}
                    multiple={multiple}
                    multipleMaxCount={multipleMaxCount}
                    multipleMaxSize={multipleMaxSize}
                >
                    {({ showFileManager }) => (
                        <Ui.Image
                            renderImagePreview={renderImagePreview || defaultRenderImagePreview}
                            style={styles}
                            value={value}
                            uploadImage={showFileManager}
                            removeImage={onChange}
                            round={round}
                            placeholder={placeholder}
                        />
                    )}
                </FileManager>

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}
                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </FileUploadWrapper>
        );
    }
}
