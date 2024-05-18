import React from "react";
import { FormComponentProps } from "~/types";
import BrowseFiles, { SelectedFile, FileError } from "react-butterfiles";
import { FormElementMessage } from "~/FormElementMessage";
import styled from "@emotion/styled";
import classNames from "classnames";
import Image from "./Image";
import { ImageEditorDialog } from "./ImageEditorDialog";

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

interface SingleImageUploadProps extends FormComponentProps {
    // Component label.
    label?: string;

    // Is component disabled?
    disabled?: boolean;

    // Description beneath the image.
    description?: string;

    // A className for the root element.
    className?: string;

    // Define a list of accepted image types.
    accept?: string[];

    // Define file's max allowed size (default is "10mb").
    // Uses "bytes" (https://www.npmjs.com/package/bytes) library to convert string notation to actual number.
    maxSize: string;

    // Image editor options.
    // Please check the docs of ImageEditor component for the list of all available options.
    imageEditor?: {
        [key: string]: any;
    };

    // Custom image preview renderer. By default images are rendered via simple <img> element.
    renderImagePreview?: () => React.ReactElement<any>;

    // Should remove image button (top right ✕) be shown? Default is set to `true`.
    showRemoveImageButton?: boolean;

    // Use these to customize error messages (eg. if i18n supported is needed).
    errorMessages: {
        maxSizeExceeded: string;
        unsupportedFileType: string;
        default: string;
        multipleNotAllowed: string;
        multipleMaxSizeExceeded: string;
    };
}

interface StateImage {
    name: string;
    type: string;
    size: number;
    src?: string;
}
interface State {
    loading: boolean;
    error: FileError | null;
    imageEditor: {
        image: StateImage | null;
        open: boolean;
    };
}

// Do not apply editing for following image types.
const noImageEditingTypes = ["image/svg+xml", "image/gif"];

type ErrorType =
    | "maxSizeExceeded"
    | "unsupportedFileType"
    | "default"
    | "multipleNotAllowed"
    | "multipleMaxSizeExceeded";

export class SingleImageUpload extends React.Component<SingleImageUploadProps, State> {
    static defaultProps: Partial<SingleImageUploadProps> = {
        maxSize: "10mb",
        imageEditor: {},
        accept: ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
        showRemoveImageButton: true,
        errorMessages: {
            maxSizeExceeded: "Max size exceeded.",
            multipleMaxSizeExceeded: "Selected fields exceed max file size.",
            multipleNotAllowed: "Multiple selection not allowed.",
            unsupportedFileType: "Unsupported file type.",
            default: "An error occurred."
        }
    };

    public override state: State = {
        loading: false,
        error: null,
        imageEditor: {
            open: false,
            image: null
        }
    };

    handleFiles = (images: SelectedFile[]) => {
        const { onChange, imageEditor } = this.props;
        const image = {
            name: images[0].name,
            type: images[0].type,
            size: images[0].size,
            src: images[0].src.base64
        };

        this.setState({ error: null }, () => {
            if (imageEditor && !noImageEditingTypes.includes(image.type)) {
                this.setState({ imageEditor: { image, open: true } });
            } else {
                onChange && onChange(image);
            }
        });
    };

    handleErrors = (errors: FileError[]) => {
        const [error] = errors;
        this.setState({ error });
    };

    public override render() {
        const {
            className,
            value,
            validation,
            label,
            description,
            accept,
            maxSize,
            onChange,
            imageEditor,
            showRemoveImageButton,
            renderImagePreview
        } = this.props;

        let imageEditorImageSrc = "";
        if (this.state.imageEditor.image && this.state.imageEditor.image.src) {
            imageEditorImageSrc = this.state.imageEditor.image.src;
        }

        const src = value ? value.src : null;

        const errorType = this.state.error ? (this.state.error.type as ErrorType) : null;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};
        /**
         * accept can be safely cast because of default value
         * errorType as keyof Props["errorMessages"] can be safely
         */
        return (
            <ImageUploadWrapper className={classNames(className)}>
                {label && !src && (
                    <div className="mdc-floating-label mdc-floating-label--float-above">
                        {label}
                    </div>
                )}

                <ImageEditorDialog
                    options={imageEditor}
                    open={this.state.imageEditor.open}
                    src={imageEditorImageSrc}
                    onClose={() => {
                        this.setState(state => {
                            state.imageEditor.open = false;
                            return state;
                        });
                    }}
                    onAccept={src => {
                        // We wrapped everything into setTimeout - prevents dialog freeze when larger image is selected.
                        setTimeout(() => {
                            this.setState({ loading: true }, async () => {
                                onChange &&
                                    (await onChange({ ...this.state.imageEditor.image, src }));
                                this.setState({
                                    loading: false,
                                    imageEditor: {
                                        image: null,
                                        open: false
                                    }
                                });
                            });
                        });
                    }}
                />
                <BrowseFiles
                    accept={accept as string[]}
                    maxSize={maxSize}
                    convertToBase64
                    onSuccess={this.handleFiles}
                    onError={this.handleErrors}
                >
                    {({ browseFiles, getDropZoneProps }) => (
                        <div {...getDropZoneProps()}>
                            <Image
                                renderImagePreview={renderImagePreview}
                                loading={this.state.loading}
                                value={value}
                                removeImage={showRemoveImageButton ? onChange : undefined}
                                uploadImage={browseFiles}
                                editImage={browseFiles}
                            />
                        </div>
                    )}
                </BrowseFiles>

                {validationIsValid === false && (
                    <FormElementMessage error>{validationMessage}</FormElementMessage>
                )}

                {validationIsValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}

                {this.state.error && (
                    <FormElementMessage error>
                        {this.props.errorMessages[
                            errorType as keyof SingleImageUploadProps["errorMessages"]
                        ] || this.props.errorMessages.default}
                    </FormElementMessage>
                )}
            </ImageUploadWrapper>
        );
    }
}
