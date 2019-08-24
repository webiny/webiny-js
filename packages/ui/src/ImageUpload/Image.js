// @flow
import * as React from "react";
import styled from "react-emotion";
import classNames from "classnames";
import { ReactComponent as AddImageIcon } from "./icons/round-add_photo_alternate-24px.svg";
import { ReactComponent as RemoveImageIcon } from "./icons/round-close-24px.svg";
import { ReactComponent as EditImageIcon } from "./icons/round-edit-24px.svg";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";

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

const EditImage = styled("div")({
    position: "absolute",
    cursor: "pointer",
    top: 10,
    left: 10,
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
    position: "relative",
    [AddImageWrapper]: {
        position: "absolute",
        display: "none",
        top: 0,
        height: "100%",
        zIndex: 1,
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
        },
        [EditImage]: {
            display: "block",
            zIndex: 2
        }
    }
});

type Props = {
    uploadImage: Function,
    removeImage?: ?Function,
    editImage?: Function,
    value?: Object,
    disabled?: boolean,
    loading?: boolean,
    placeholder: string,
    renderImagePreview?: Object => React.Element<any>
};

class Image extends React.Component<Props> {
    static defaultProps = {
        placeholder: "Select an image"
    };

    renderBlank() {
        const { uploadImage } = this.props;

        return (
            <AddImageWrapper
                data-role={"select-image"}
                onClick={() => {
                    uploadImage();
                }}
            >
                <AddImageIconWrapper>
                    <AddImageIcon />
                    <Typography use={"caption"}>{this.props.placeholder}</Typography>
                </AddImageIconWrapper>
            </AddImageWrapper>
        );
    }

    renderImg() {
        const { removeImage, editImage, uploadImage, value, renderImagePreview } = this.props;

        const imagePreviewProps: Object = {
            src: value ? value.src : null,
            style: this.props.style ? this.props.style : null,
            onClick: () => uploadImage()
        };

        if (!imagePreviewProps.style) {
            imagePreviewProps.style = {};
        }

        if (!imagePreviewProps.style.width && !imagePreviewProps.style.height) {
            imagePreviewProps.style.width = "100%";
            imagePreviewProps.style.height = "100%";
        }

        let imagePreview = null;
        if (typeof renderImagePreview === "function") {
            imagePreview = renderImagePreview(imagePreviewProps);
        } else {
            imagePreview = <img {...imagePreviewProps} />;
        }

        return (
            <ImagePreviewWrapper>
                {imagePreview}

                {typeof removeImage === "function" && (
                    <RemoveImage onClick={() => removeImage(null)}>
                        <RemoveImageIcon />
                    </RemoveImage>
                )}

                {typeof editImage === "function" && (
                    <EditImage onClick={() => editImage(value)}>
                        <EditImageIcon />
                    </EditImage>
                )}

                <AddImageWrapper
                    data-role={"select-image"}
                    onClick={() => {
                        uploadImage();
                    }}
                >
                    <AddImageIconWrapper>
                        <AddImageIcon />
                        <Typography use={"caption"}>{this.props.placeholder}</Typography>
                    </AddImageIconWrapper>
                </AddImageWrapper>
            </ImagePreviewWrapper>
        );
    }

    render() {
        const { value, disabled } = this.props;
        return (
            <div className={classNames({ disabled })} style={{ height: "100%" }}>
                {this.props.loading && <CircularProgress />}
                {value && value.src ? this.renderImg() : this.renderBlank()}
            </div>
        );
    }
}

export default Image;
