// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import BrowseFiles, { type SelectedFile, type FileError } from "react-butterfiles";
import { css } from "emotion";
import classNames from "classnames";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import Image from "./Image";
import ImageEditorDialog from "./ImageEditorDialog";

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

// Do not apply editping for following image types.
// const noImageEditorTypes = ["image/svg+xml", "image/gif"];

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

    // Image editor options.
    // Please check the docs of ImageEditor component for the list of all available options.
    imageEditor?: Object,

    // Use these to customize error messages (eg. if i18n supported is needed).
    errorMessages: {
        maxSizeExceeded: string,
        unsupportedFileType: string,
        default: string
    }
};

type State = {
    errors: ?Array<FileError>,
    selectedImages: Object,
    loading: boolean,
    imageEditor: {
        image: ?SelectedFile,
        open: boolean,
        index: ?number
    }
};

class MultiImageUpload extends React.Component<Props, State> {
    static defaultProps = {
        accept: ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
        maxSize: "5mb",
        imageEditor: {},
        errorMessages: {
            maxSizeExceeded: "Max size exceeded.",
            unsupportedFileType: "Unsupported file type.",
            default: "An error occurred."
        }
    };

    state = {
        errors: null,
        selectedImages: {},
        loading: false,
        imageEditor: {
            open: false,
            image: null,
            index: null
        }
    };

    onChange = async (value: any) => {
        const { onChange, validate } = this.props;
        onChange && (await onChange(value));
        validate && (await validate());
    };

    handleSelectedImages = async (images: Array<SelectedFile>, selectedIndex: number = 0) => {
        this.setState({ errors: null, loading: true }, async () => {
            const selectedImages = {};
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                selectedImages[selectedIndex + i] = { ...image };
            }

            this.setState({ selectedImages }, async () => {
                const newValue = Array.isArray(this.props.value) ? [...this.props.value] : [];

                const convertedImages = [];
                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    convertedImages.push({
                        src: image.src.base64,
                        name: image.name,
                        size: image.size,
                        type: image.type
                    });
                }

                newValue.splice(selectedIndex, 0, ...convertedImages);
                await this.onChange(newValue);
                this.setState({ loading: false });
            });
        });
    };

    handleErrors = (errors: Array<FileError>) => {
        this.setState({ errors });
    };

    removeImage = (image: SelectedFile) => {
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
            imageEditor,
            accept,
            maxSize,
            className
        } = this.props;

        let imageEditorImageSrc = "";
        if (this.state.imageEditor.image) {
            imageEditorImageSrc = (this.state.imageEditor.image.src: any);
        }

        return (
            <div className={classNames(imagesStyle, className)}>
                {label && (
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
                                const newValue = Array.isArray(this.props.value)
                                    ? [...this.props.value]
                                    : [];

                                const imageEditorImageIndex: number = (this.state.imageEditor
                                    .index: any);
                                newValue[imageEditorImageIndex].src = src;

                                await this.onChange(newValue);
                                this.setState({
                                    loading: false,
                                    imageEditor: { image: null, open: false, index: null }
                                });
                            });
                        });
                    }}
                />

                <BrowseFiles
                    accept={accept}
                    maxSize={maxSize}
                    multiple
                    convertToBase64
                    onSuccess={files => {
                        this.handleSelectedImages(files, Array.isArray(value) ? value.length : 0);
                    }}
                    onError={errors => this.handleErrors(errors)}
                >
                    {({ browseFiles, getDropZoneProps }) => {
                        const images = Array.isArray(value) ? [...value] : [];

                        return (
                            <div {...getDropZoneProps({ className: classNames({ disabled }) })}>
                                <ul className="images">
                                    {images.map((image, index) => (
                                        <li key={index}>
                                            <Image
                                                loading={
                                                    this.state.selectedImages[index] &&
                                                    this.state.loading
                                                }
                                                value={image.file || image}
                                                removeImage={() =>
                                                    this.removeImage(image.file || image)
                                                }
                                                editImage={
                                                    this.state.selectedImages[index] &&
                                                    (() => {
                                                        this.setState({
                                                            imageEditor: {
                                                                index,
                                                                open: true,
                                                                image: this.state.selectedImages[
                                                                    index
                                                                ]
                                                            }
                                                        });
                                                    })
                                                }
                                                uploadImage={() => {
                                                    browseFiles({
                                                        onSuccess: files => {
                                                            this.handleSelectedImages(
                                                                files,
                                                                index + 1
                                                            );
                                                        },
                                                        onErrors: errors =>
                                                            this.handleErrors(errors)
                                                    });
                                                }}
                                            />
                                        </li>
                                    ))}
                                    <li>
                                        <Image
                                            disabled={this.state.loading}
                                            uploadImage={() => {
                                                browseFiles({
                                                    onSuccess: files => {
                                                        this.handleSelectedImages(
                                                            files,
                                                            Array.isArray(value) ? value.length : 0
                                                        );
                                                    },
                                                    onErrors: errors => this.handleErrors(errors)
                                                });
                                            }}
                                        />
                                    </li>
                                </ul>
                            </div>
                        );
                    }}
                </BrowseFiles>

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}

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
