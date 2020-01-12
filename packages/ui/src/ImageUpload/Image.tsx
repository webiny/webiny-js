import * as React from "react";
import classNames from "classnames";
import { ReactComponent as AddImageIcon } from "./icons/round-add_photo_alternate-24px.svg";
import { ReactComponent as RemoveImageIcon } from "./icons/round-close-24px.svg";
import { ReactComponent as EditImageIcon } from "./icons/round-edit-24px.svg";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import {
    AddImageIconWrapper,
    AddImageWrapper,
    EditImage,
    ImagePreviewWrapper,
    RemoveImage
} from "./styled";

type Props = {
    uploadImage: Function;
    removeImage?: Function;
    editImage?: Function;
    value?: any;
    disabled?: boolean;
    loading?: boolean;
    placeholder: string;
    style?: { [key: string]: any };
    renderImagePreview?: (props: any) => React.ReactElement<any>;
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
