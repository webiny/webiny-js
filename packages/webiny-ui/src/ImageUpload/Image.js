// @flow
import * as React from "react";
import styled from "react-emotion";
import classNames from "classnames";
import { ReactComponent as AddImageIcon } from "./icons/round-add_photo_alternate-24px.svg";
import { ReactComponent as RemoveImageIcon } from "./icons/round-close-24px.svg";
import { Typography } from "webiny-ui/Typography";

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
    position: "relative",
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

type Props = {
    uploadImage: Function,
    value?: Object,
    removeImage?: Function,
    disabled?: boolean
};

class Image extends React.Component<Props> {
    render() {
        const { value, disabled, uploadImage, removeImage } = this.props;

        return (
            <div className={classNames({ disabled })} style={{ height: "100%" }}>
                {value && value.src ? (
                    <ImagePreviewWrapper>
                        <img
                            alt={value.name}
                            src={value.src}
                            onClick={() => {
                                uploadImage();
                            }}
                        />

                        <RemoveImage onClick={() => removeImage && removeImage(null)}>
                            <RemoveImageIcon />
                        </RemoveImage>

                        <AddImageWrapper
                            onClick={() => {
                                uploadImage();
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
                            uploadImage();
                        }}
                    >
                        <AddImageIconWrapper>
                            <AddImageIcon />
                            <Typography use={"caption"}>Select image</Typography>
                        </AddImageIconWrapper>
                    </AddImageWrapper>
                )}
            </div>
        );
    }
}

export default Image;
