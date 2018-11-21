// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { FileBrowser, type FileBrowserFile, type FileError } from "webiny-ui/FileBrowser";
import { FormElementMessage } from "webiny-ui/FormElementMessage";
import styled from "react-emotion";
import classNames from "classnames";
import Image from "./Image";
import ImageEditorDialog from "./ImageEditorDialog";

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

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is component disabled?
    disabled?: boolean,

    // Description beneath the image.
    description?: string,

    // A className for the root element.
    className?: string,

    // Define a list of accepted image types.
    accept?: Array<string>,

    // Define file's max allowed size (default is "5mb").
    // Uses "bytes" (https://www.npmjs.com/package/bytes) library to convert string notation to actual number.
    maxSize: string,

    // Preview <img> props (eg. width, height, alt, title ...).
    img?: Object,

    // By default, the editor tool will be shown when an image is selected.
    // Set to false if there is no need for editor to be shown. Otherwise, set true (default value) or alternatively
    // an object containing all of the image editor related options (eg. "filter").
    // Please check the docs of ImageEditor component for the list of all available options.
    imageEditor?: boolean | Object,

    // Should remove image button (top right ✕) be shown? Default is set to `true`.
    showRemoveImageButton?: boolean,

    // Use these to customize error messages (eg. if i18n supported is needed).
    errorMessages: {
        maxSizeExceeded: string,
        unsupportedFileType: string,
        default: string
    }
};

type State = {
    loading: boolean,
    error: ?FileError,
    imageEditor: {
        image: ?FileBrowserFile,
        open: boolean
    }
};

// Do not apply editing for following image types.
const noImageEditingTypes = ["image/svg+xml", "image/gif"];

export class SingleImageUpload extends React.Component<Props, State> {
    static defaultProps = {
        maxSize: "5mb",
        accept: ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
        imageEditor: true,
        showRemoveImageButton: true,
        errorMessages: {
            maxSizeExceeded: "Max size exceeded.",
            unsupportedFileType: "Unsupported file type.",
            default: "An error occurred."
        }
    };

    state = {
        loading: false,
        error: null,
        imageEditor: {
            open: false,
            image: null
        }
    };

    handleFiles = async (images: Array<FileBrowserFile>) => {
        const { onChange, imageEditor } = this.props;
        const image = { ...images[0] };
        this.setState({ error: null }, async () => {
            if (imageEditor && !noImageEditingTypes.includes(image.type)) {
                this.setState({ imageEditor: { image, open: true } });
            } else {
                onChange && onChange(image);
            }
        });
    };

    handleErrors = (errors: Array<FileError>) => {
        const [error] = errors;
        this.setState({ error });
    };

    render() {
        const {
            className,
            value,
            validation = { isValid: null },
            label,
            img,
            description,
            accept,
            maxSize,
            onChange,
            showRemoveImageButton
        } = this.props;

        let imageEditorImageSrc = "";
        if (this.state.imageEditor.image) {
            imageEditorImageSrc = (this.state.imageEditor.image.src: any);
        }

        return (
            <ImageUploadWrapper className={classNames(className)}>
                {label && !value && (
                    <div className="mdc-floating-label mdc-floating-label--float-above">
                        {label}
                    </div>
                )}

                <ImageEditorDialog
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
                                    imageEditor: { image: null, open: false }
                                });
                            });
                        });
                    }}
                />
                <FileBrowser accept={accept} maxSize={maxSize} convertToBase64>
                    {({ browseFiles }) => (
                        <Image
                            img={img}
                            loading={this.state.loading}
                            value={value}
                            removeImage={showRemoveImageButton ? onChange : null}
                            uploadImage={() => {
                                browseFiles({
                                    onSuccess: files => this.handleFiles(files),
                                    onErrors: errors => this.handleErrors(errors)
                                });
                            }}
                        />
                    )}
                </FileBrowser>

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}

                {this.state.error && (
                    <FormElementMessage error>
                        {this.props.errorMessages[this.state.error.type] ||
                            this.props.errorMessages.default}
                    </FormElementMessage>
                )}
            </ImageUploadWrapper>
        );
    }
}
