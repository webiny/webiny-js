import * as React from "react";
import { css } from "emotion";
import { ReactComponent as FileIcon } from "@webiny/app-admin/assets/icons/insert_drive_file-24px.svg";

export const imagePlugins = [".jpg", ".jpeg", ".gif", ".png", ".svg"];

export const imageWrapperStyles = css({
    height: "auto"
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

interface CreateRenderImagePreviewParams {
    value: {
        src: string;
        name: string;
    };
    imagePreviewProps: any;
}

export const createRenderImagePreview = ({
    value,
    imagePreviewProps
}: CreateRenderImagePreviewParams) => {
    const fileName = value.name;

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
