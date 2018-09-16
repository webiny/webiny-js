// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { FileBrowser, type FileBrowserFile, type FileError } from "webiny-ui/FileBrowser";
import {FormElementMessage} from "webiny-ui/FormElementMessage";
import styled from "react-emotion";
import classNames from "classnames";
import { ReactComponent as AddImageIcon } from "./icons/round-add_photo_alternate-24px.svg";
import { ReactComponent as RemoveImageIcon } from "./icons/round-close-24px.svg";
import { Typography } from "webiny-ui/Typography";

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

const AddImageIconWrapper = styled("div")({
    color: "var(--mdc-theme-text-secondary-on-background)",
    ">svg": {
        width: "100%",
        height: "100%",
        maxWidth: 50,
        maxHeight: 50,
        display: "block",
        opacity: 0.5,
        margin: "0 auto"
    }
});

const AddImageWrapper = styled("div")({
    width: "100%",
    height: "100%",
    minHeight: 50,
    minWidth: 50,
    textAlign: "center",
    backgroundColor: "var(--mdc-theme-on-background)",
    borderRadius: 0,
    borderBottom: "1px solid var(--mdc-theme-text-hint-on-background)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    transition: "color 0.2s",
    cursor: "pointer",
    padding: 10,
    boxSizing: "border-box",
    "&:hover": {
        backgroundColor: "rgba(0,0,0, 0.5)",
        borderBottom: "1px solid var(--mdc-theme-on-surface)"
    }
});

const RemoveImage = styled("div")({
    position: "absolute",
    cursor: "pointer",
    top: 10,
    right: 10,
    display: "none",
    color: "white",
    opacity: 0.5,
    "&:hover": {
        opacity: 0.75
    }
});

const ImagePreviewWrapper = styled("div")({
    width: "100%",
    height: "100%",
    minHeight: 50,
    minWidth: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    boxSizing: "border-box",
    position:'relative',
    ">img": {
        width: "100%",
        height: "100%"
    },
    [AddImageWrapper]: {
        position: "absolute",
        display: "none",
        top: 0,
        height: "100%",
        backgroundColor: "rgba(0,0,0, 0.75)",
        [AddImageIconWrapper]: {
            top: "50%",
            left: "50%",
            transform: "translateY(-50%) translateX(-50%)",
            position: "absolute",
            color: "white"
        }
    },
    "&:hover": {
        [AddImageWrapper]: {
            display: "block"
        },
        [RemoveImage]: {
            display: "block",
            zIndex: 2
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

type State = {
    error: ?FileError
};

class Image extends React.Component<Props, State> {
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
            disabled,
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
                        <div className={classNames({ disabled })}>
                            {value && value.src ? (
                                <ImagePreviewWrapper>
                                    {/* // TODO: ovdje onClick nebi trebao direkt na <img> biti ofc (ikona nekakva?) */}
                                    <img
                                        alt={value.name}
                                        src={value.src}
                                        onClick={() => {
                                            browseFiles({
                                                onSuccess: files => this.handleFiles(files),
                                                onErrors: errors => this.handleErrors(errors)
                                            });
                                        }}
                                    />

                                    <RemoveImage onClick={() => onChange && onChange(null)}>
                                        <RemoveImageIcon />
                                    </RemoveImage>

                                    <AddImageWrapper
                                        onClick={() => {
                                            browseFiles({
                                                onSuccess: files => this.handleFiles(files),
                                                onErrors: errors => this.handleErrors(errors)
                                            });
                                        }}
                                    >
                                        <AddImageIconWrapper>
                                            <AddImageIcon />
                                            <Typography use={"caption"}>Select image</Typography>
                                        </AddImageIconWrapper>
                                    </AddImageWrapper>
                                </ImagePreviewWrapper>
                            ) : (
                                <AddImageWrapper
                                    onClick={() => {
                                        browseFiles({
                                            onSuccess: files => this.handleFiles(files),
                                            onErrors: errors => this.handleErrors(errors)
                                        });
                                    }}
                                >
                                    <AddImageIconWrapper>
                                        <AddImageIcon />
                                        <Typography use={"caption"}>Select image</Typography>
                                    </AddImageIconWrapper>
                                </AddImageWrapper>
                            )}
                        </div>
                    )}
                </FileBrowser>

                {validation.isValid === false && (
                    <FormElementMessage error>
                        {validation.message}
                    </FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>
                        {description}
                    </FormElementMessage>
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

export { Image };
