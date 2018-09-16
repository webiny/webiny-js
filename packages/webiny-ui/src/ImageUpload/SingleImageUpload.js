// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { FileBrowser, type FileBrowserFile, type FileError } from "webiny-ui/FileBrowser";
import { FormElementMessage } from "webiny-ui/FormElementMessage";
import styled from "react-emotion";
import classNames from "classnames";
import Image from "./Image";

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

type State = {
    error: ?FileError
};

class SingleImageUpload extends React.Component<Props, State> {
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
        error: null
    };

    handleFiles = async (files: Array<FileBrowserFile>) => {
        this.setState({ error: null }, () => {
            const { onChange } = this.props;
            onChange && onChange(files[0]);
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
            onChange
        } = this.props;

        return (
            <ImageUploadWrapper className={classNames(className)}>
                {label &&
                    !value && (
                        <div className="mdc-floating-label mdc-floating-label--float-above">
                            {label}
                        </div>
                    )}

                <FileBrowser convertToBase64 accept={accept} maxSize={maxSize}>
                    {({ browseFiles }) => (
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
                    )}
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

export { SingleImageUpload };
