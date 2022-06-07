import React from "react";
import classNames from "classnames";
import { ReactComponent as AddImageIcon } from "./icons/round-add_photo_alternate-24px.svg";
import { ReactComponent as RemoveImageIcon } from "./icons/round-close-24px.svg";
import { ReactComponent as EditImageIcon } from "./icons/round-edit-24px.svg";
import { Typography } from "../Typography";
import { CircularProgress } from "../Progress";
import {
    AddImageIconWrapper,
    AddImageWrapper,
    AddImageWrapperRound,
    EditImage,
    ImagePreviewWrapper,
    RemoveImage
} from "./styled";

interface ImageProps {
    uploadImage: () => void;
    removeImage?: (value: string | null) => void;
    editImage?: Function;
    value?: any;
    disabled?: boolean;
    loading?: boolean;
    placeholder: string;
    style?: React.CSSProperties;
    renderImagePreview?: (props: any) => React.ReactElement<any>;
    round?: boolean;
    containerStyle?: React.CSSProperties;
}

class Image extends React.Component<ImageProps> {
    static defaultProps = {
        placeholder: "Select an image",
        containerStyle: { height: "100%" }
    };

    renderBlank() {
        const { uploadImage, round } = this.props;

        const ImageWrapper = round ? AddImageWrapperRound : AddImageWrapper;

        return (
            <ImageWrapper
                data-role={"select-image"}
                onClick={() => {
                    uploadImage();
                }}
            >
                <AddImageIconWrapper>
                    <AddImageIcon />
                    <Typography use={"caption"}>{this.props.placeholder}</Typography>
                </AddImageIconWrapper>
            </ImageWrapper>
        );
    }

    renderImg() {
        const { removeImage, editImage, uploadImage, value, renderImagePreview } = this.props;

        const imagePreviewProps: any = {
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
            <ImagePreviewWrapper data-testid={"image-preview"}>
                {imagePreview}

                {typeof removeImage === "function" && (
                    <RemoveImage onClick={() => removeImage(null)} data-testid={"remove-image"}>
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

    public override render() {
        const { value, disabled, containerStyle } = this.props;
        return (
            <div className={classNames({ disabled })} style={containerStyle}>
                {this.props.loading && <CircularProgress />}
                {value && value.src ? this.renderImg() : this.renderBlank()}
            </div>
        );
    }
}

export default Image;
