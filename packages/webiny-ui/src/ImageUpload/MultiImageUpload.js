// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { FileBrowser, type FileBrowserFile, type FileError } from "webiny-ui/FileBrowser";
import { ImageCropper } from "webiny-ui/ImageCropper";
import { ButtonPrimary, ButtonSecondary } from "webiny-ui/Button";
import { css } from "emotion";
import classNames from "classnames";
import { FormElementMessage } from "webiny-ui/FormElementMessage";
import Image from "./Image";
import range from "lodash/range";

const imagesStyle = css({
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    "ul.images": {
        listStyle: "none",
        li: {
            verticalAlign: "top",
            margin: 2,
            display: "inline-block",
            width: 150,
            height: 150,
            "&:last-child": {
                border: "1px solid lightgray",
                cursor: "pointer",
                textAlign: "center"
            }
        }
    }
});

// Do not apply cropping for following image types.
const noCroppingTypes = ["image/svg+xml", "image/gif"];

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
    // Set to false (default value) if there is no need for cropper to be shown. Otherwise, set true or alternatively
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

type ImageType = {
    src: string | File | null,
    name: string,
    size: number,
    type: string
};

type State = {
    errors: ?Array<FileError>,
    showCropper: Array<number>
};

class MultiImageUpload extends React.Component<Props, State> {
    static defaultProps = {
        accept: ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
        maxSize: "5mb",
        cropper: false,
        errorMessages: {
            maxSizeExceeded: "Max size exceeded.",
            unsupportedFileType: "Unsupported file type.",
            default: "An error occurred."
        }
    };

    state = {
        errors: null,
        showCropper: []
    };

    removeImage = (image: ImageType) => {
        const { value, onChange } = this.props;
        if (!onChange) {
            return;
        }

        const images = Array.isArray(value) ? [...value] : [];
        images.splice(images.indexOf(image), 1);
        onChange(images);
    };

    handleFiles = async (files: Array<FileBrowserFile>, index: number = 0) => {
        const { value, onChange, validate, cropper } = this.props;
        this.setState({ errors: null });

        const newValue = value ? [...value] : [];
        newValue.splice(index, 0, ...files);

        validate && (await validate());
        onChange && onChange(newValue);
        cropper && this.setState({ showCropper: range(index, index + files.length) });
    };

    handleErrors = (errors: Array<FileError>) => {
        this.setState({ errors });
    };

    finishCrop(index: number, src: ?string) {
        const { value, onChange } = this.props;

        this.setState(
            state => {
                state.showCropper.splice(state.showCropper.indexOf(index), 1);
                return state;
            },
            () => {
                if (!onChange) {
                    return;
                }

                const newValue = value ? [...value] : [];
                newValue[index].src = src;
                onChange(newValue);
            }
        );
    }

    cancelCrop(index: number) {
        this.setState(state => {
            state.showCropper.splice(state.showCropper.indexOf(index), 1);
            return state;
        });
    }

    render() {
        const {
            value,
            validation = { isValid: null },
            label,
            description,
            disabled,
            accept,
            maxSize,
            cropper,
            className
        } = this.props;

        const { showCropper } = this.state;

        return (
            <div className={classNames(imagesStyle, className)}>
                {label && (
                    <div className="mdc-floating-label mdc-floating-label--float-above">
                        {label}
                    </div>
                )}

                <FileBrowser accept={accept} maxSize={maxSize} multiple convertToBase64>
                    {({ browseFiles }) => {
                        const imageCropperProps = typeof cropper === "object" ? cropper : null;

                        return (
                            <div className={classNames({ disabled })}>
                                <ul className="images">
                                    {Array.isArray(value) &&
                                        value.map((file, index) => (
                                            <li key={index}>
                                                {Array.isArray(showCropper) &&
                                                showCropper.includes(index) &&
                                                !noCroppingTypes.includes(file.type) ? (
                                                    <ImageCropper {...imageCropperProps}>
                                                        {({ getDataURL, getImgProps }) => (
                                                            <React.Fragment>
                                                                <img
                                                                    {...getImgProps({
                                                                        src: file.src
                                                                    })}
                                                                />
                                                                <ButtonPrimary
                                                                    label={"Crop"}
                                                                    onClick={() =>
                                                                        this.finishCrop(
                                                                            index,
                                                                            getDataURL()
                                                                        )
                                                                    }
                                                                >
                                                                    Crop
                                                                </ButtonPrimary>

                                                                <ButtonSecondary
                                                                    label={"Cancel"}
                                                                    onClick={() =>
                                                                        this.cancelCrop(index)
                                                                    }
                                                                >
                                                                    Cancel
                                                                </ButtonSecondary>
                                                            </React.Fragment>
                                                        )}
                                                    </ImageCropper>
                                                ) : (
                                                    <Image
                                                        value={file}
                                                        removeImage={() => this.removeImage(file)}
                                                        uploadImage={() => {
                                                            browseFiles({
                                                                onSuccess: files =>
                                                                    this.handleFiles(
                                                                        files,
                                                                        index + 1
                                                                    ),
                                                                onErrors: errors =>
                                                                    this.handleErrors(errors)
                                                            });
                                                        }}
                                                    />
                                                )}
                                            </li>
                                        ))}
                                    <li>
                                        <Image
                                            uploadImage={() => {
                                                browseFiles({
                                                    onSuccess: files =>
                                                        this.handleFiles(
                                                            files,
                                                            Array.isArray(value) ? value.length : 0
                                                        ),
                                                    onErrors: errors => this.handleErrors(errors)
                                                });
                                            }}
                                        />
                                    </li>
                                </ul>
                            </div>
                        );
                    }}
                </FileBrowser>

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false &&
                    description && <FormElementMessage>{description}</FormElementMessage>}

                {Array.isArray(this.state.errors) && (
                    <FormElementMessage error>
                        Your selection of images failed because of the following images:
                        <ul>
                            {this.state.errors.map((error: FileError, index) => {
                                return (
                                    <li key={error.file.name + index}>
                                        {index + 1}. <strong>{error.file.name}</strong> -&nbsp;
                                        {this.props.errorMessages[error.type] ||
                                            this.props.errorMessages.default}
                                    </li>
                                );
                            })}
                        </ul>
                    </FormElementMessage>
                )}
            </div>
        );
    }
}

export { MultiImageUpload };
