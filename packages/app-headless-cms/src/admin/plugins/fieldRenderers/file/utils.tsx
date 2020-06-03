import * as React from "react";
import { css } from "emotion";
import { ReactComponent as FileIcon } from "../../fields/icons/round_insert_drive_file-24px.svg";

export const imageExtensions = [".jpg", ".jpeg", ".gif", ".png", ".svg"];

export const imageWrapperStyles = css({
    height: 232
});

const fileLabel = css({
    padding: "10px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "0.8rem",
    color: "var(--mdc-theme-on-surface)",
    backgroundColor: "var(--mdc-theme-on-background)"
});

const IconWrapperStyle = css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 200
});

const IconStyle = css({
    width: 64,
    height: 64
});

export const createRenderImagePreview = ({ value, imagePreviewProps }) => {
    const fileName = getFileName(value);

    const renderImagePreview = renderImageProps => {
        return (
            <div {...renderImageProps} {...imagePreviewProps}>
                <div className={IconWrapperStyle}>
                    <FileIcon className={IconStyle} />
                </div>
                <div className={fileLabel}>{fileName}</div>
            </div>
        );
    };
    return renderImagePreview;
};

const getFileName = value => {
    if (!value) {
        return "";
    }
    return value.split("/").pop();
};
