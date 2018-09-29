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

    // By default, a cropper tool will be shown when an image is selected.
    // Set to false if there is no need for cropper to be shown. Otherwise, set true (default value) or alternatively
    // an object containing all of the cropper related options (eg. "aspectRatio").
    // Please check the docs of CropperJs (https://github.com/fengyuanchen/cropperjs for the list of all
    // available options.
    cropper?: boolean | Object,

    // Use these to customize error messages (eg. if i18n supported is needed).
    errorMessages: {
        maxSizeExceeded: string,
        unsupportedFileType: string,
        default: string
    }
};

type State = {
    error: ?FileError,
    imageToEdit: ?FileBrowserFile
};

// Do not apply cropping for following image types.
const noCroppingTypes = ["image/svg+xml", "image/gif"];

export class SingleImageUpload extends React.Component<Props, State> {
    static defaultProps = {
        maxSize: "5mb",
        accept: ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
        cropper: true,
        errorMessages: {
            maxSizeExceeded: "Max size exceeded.",
            unsupportedFileType: "Unsupported file type.",
            default: "An error occurred."
        }
    };

    state = {
        error: null,
        imageToEdit: null
    };

    handleFiles = async (files: Array<FileBrowserFile>) => {
        const { onChange, cropper } = this.props;
        const [file] = files;
        console.log(file);
        this.setState({ error: null }, () => {
            if (cropper && !noCroppingTypes.includes(file.type)) {
                this.setState({ imageToEdit: file });
            } else {
                onChange && onChange(file);
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
            description,
            accept,
            maxSize,
            onChange,
            cropper
        } = this.props;

        return (
            <ImageUploadWrapper className={classNames(className)}>
                {label &&
                    !value && (
                        <div className="mdc-floating-label mdc-floating-label--float-above">
                            {label}
                        </div>
                    )}

                <ImageEditorDialog open={this.state.imageToEdit} image={this.state.imageToEdit} />
                <FileBrowser
                    accept={accept}
                    maxSize={maxSize}
                    onClose={() => {
                        this.setState({ imageToEdit: null });
                    }}
                >
                    {({ browseFiles }) => {
                        return (
                            <Image
                                value={value}
                                removeImage={onChange}
                                uploadImage={() => {
                                    browseFiles({
                                        onSuccess: files => this.handleFiles(files),
                                        onErrors: errors => this.handleErrors(errors)
                                    });
                                }}
                            />
                        );
                    }}
                </FileBrowser>

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false &&
                    description && <FormElementMessage>{description}</FormElementMessage>}

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
