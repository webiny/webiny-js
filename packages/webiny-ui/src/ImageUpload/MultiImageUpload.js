// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { FileBrowser, type FileBrowserFile, type FileError } from "webiny-ui/FileBrowser";
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

    // Define file's max allowed size (default is "2mb").
    // Uses "bytes" (https://www.npmjs.com/package/bytes) library to convert string notation to actual number.
    maxSize: string,

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
    errors: ?Array<FileError>
};

class MultiImageUpload extends React.Component<Props, State> {
    static defaultProps = {
        accept: ["image/jpeg", "image/png", "image/gif"],
        maxSize: "5mb",
        errorMessages: {
            maxSizeExceeded: "Max size exceeded.",
            unsupportedFileType: "Unsupported file type.",
            default: "An error occurred."
        }
    };

    state = {
        errors: null
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

    handleFiles = async (files: Array<FileBrowserFile>, append: boolean = false) => {
        this.setState({ errors: null }, () => {
            const { value, onChange } = this.props;
            if (!onChange) {
                return;
            }

            if (Array.isArray(value) && append) {
                onChange([...value, ...files]);
            } else {
                onChange(files);
            }
        });
    };

    handleErrors = (errors: Array<FileError>) => {
        this.setState({ errors });
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
            className
        } = this.props;

        return (
            <div className={classNames(imagesStyle, className)}>
                {/* Ovaj container za label - isti kao i u drugim komponentama. */}
                {label && (
                    <div className="mdc-floating-label mdc-floating-label--float-above">
                        {label}
                    </div>
                )}

                <FileBrowser accept={accept} maxSize={maxSize} multiple convertToBase64>
                    {({ browseFiles }) => (
                        <div className={classNames({ disabled })}>
                            <ul className="images">
                                {Array.isArray(value) &&
                                    value.map((file, index) => (
                                        // TODO: ovdje onClick nebi trebao direkt na <img> biti ofc (ikona nekakva?)
                                        <li key={index}>
                                            <Image
                                                value={file}
                                                removeImage={() => this.removeImage(file)}
                                                uploadImage={() => {
                                                    const append =
                                                        Array.isArray(value) && value.length > 0;
                                                    browseFiles({
                                                        onSuccess: files =>
                                                            this.handleFiles(files, append),
                                                        onErrors: errors =>
                                                            this.handleErrors(errors)
                                                    });
                                                }}
                                            />
                                        </li>
                                    ))}
                                <li>
                                    <Image
                                        uploadImage={() => {
                                            const append = Array.isArray(value) && value.length > 0;
                                            browseFiles({
                                                onSuccess: files => this.handleFiles(files, append),
                                                onErrors: errors => this.handleErrors(errors)
                                            });
                                        }}
                                    />
                                </li>
                            </ul>
                        </div>
                    )}
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
