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

type NewImage = { file: FileBrowserFile, cropper: boolean, done: boolean };

type State = {
    errors: ?Array<FileError>,
    selectedImages: {
        atIndex: number,
        list: Array<NewImage>
    }
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
        selectedImages: {
            list: [],
            atIndex: 0
        }
    };

    onChange = async (value: any) => {
        const { onChange, validate } = this.props;
        onChange && (await onChange(value));
        validate && (await validate());
    };

    hasPendingSelectedImages() {
        for (let i = 0; i < this.state.selectedImages.list.length; i++) {
            if (!this.state.selectedImages.list[i].done) {
                return true;
            }
        }
        return false;
    }

    finalizeSelectedImages = async () => {
        if (this.hasPendingSelectedImages()) {
            return;
        }

        const { value } = this.props;
        const { selectedImages } = this.state;

        const newValue = Array.isArray(value) ? [...value] : [];
        newValue.splice(
            selectedImages.atIndex,
            0,
            ...selectedImages.list.map(image => image.file)
        );

        await this.onChange(newValue);

        this.setState({
            selectedImages: {
                atIndex: 0,
                list: []
            }
        });
    };

    handleSelectedImages = async (
        images: Array<FileBrowserFile>,
        selectedIndex: number = 0
    ) => {
        this.setState(
            {
                errors: null,
                selectedImages: {
                    atIndex: selectedIndex,
                    list: images.map(file => {
                        const cropper = !noCroppingTypes.includes(file.type);
                        return { file, cropper, done: !cropper };
                    })
                }
            },
            this.finalizeSelectedImages
        );
    };

    handleErrors = (errors: Array<FileError>) => {
        this.setState({ errors });
    };

    finishCrop(image: NewImage, src: string) {
        this.setState(state => {
            image.file.src = src;
            image.cropper = false;
            image.done = true;
            return state;
        }, this.finalizeSelectedImages);
    }

    cancelCrop(image: NewImage) {
        this.setState(state => {
            image.cropper = false;
            image.done = true;
            return state;
        }, this.finalizeSelectedImages);
    }

    removeImage = (image: FileBrowserFile) => {
        const { value, onChange } = this.props;
        if (!onChange) {
            return;
        }

        const images = Array.isArray(value) ? [...value] : [];
        images.splice(images.indexOf(image), 1);
        onChange(images);
    };

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

        const { selectedImages } = this.state;

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

                        const images = Array.isArray(value) ? [...value] : [];
                        images.splice(selectedImages.atIndex, 0, ...selectedImages.list);

                        return (
                            <div className={classNames({ disabled })}>
                                <ul className="images">
                                    {images.map((image, index) => (
                                        <li key={index}>
                                            {image.cropper ? (
                                                <ImageCropper {...imageCropperProps}>
                                                    {({ getDataURL, getImgProps }) => (
                                                        <React.Fragment>
                                                            <img
                                                                {...getImgProps({
                                                                    src: image.file.src
                                                                })}
                                                            />
                                                            <ButtonPrimary
                                                                label={"Crop"}
                                                                onClick={() =>
                                                                    this.finishCrop(
                                                                        image,
                                                                        getDataURL() || ""
                                                                    )
                                                                }
                                                            >
                                                                Crop
                                                            </ButtonPrimary>

                                                            <ButtonSecondary
                                                                label={"Cancel"}
                                                                onClick={() =>
                                                                    this.cancelCrop(image)
                                                                }
                                                            >
                                                                Cancel
                                                            </ButtonSecondary>
                                                        </React.Fragment>
                                                    )}
                                                </ImageCropper>
                                            ) : (
                                                <Image
                                                    value={image.file || image}
                                                    disabled={this.hasPendingSelectedImages()}
                                                    removeImage={() =>
                                                        this.removeImage(image.file || image)
                                                    }
                                                    uploadImage={() => {
                                                        browseFiles({
                                                            onSuccess: files =>
                                                                this.handleSelectedImages(
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
                                            disabled={selectedImages.list.length > 0}
                                            uploadImage={() => {
                                                browseFiles({
                                                    onSuccess: files =>
                                                        this.handleSelectedImages(
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
