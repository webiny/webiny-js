import * as React from "react";
import { css } from "emotion";
import { getPlugin } from "@webiny/plugins";
import { AdminFileManagerFileTypePlugin } from "@webiny/app-admin/types";

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

export const makeRenderImagePreview = ({ value, imagePreviewProps }) => {
    const plugin: AdminFileManagerFileTypePlugin = getPlugin("file-manager-file-type-default");
    const fileName = getFileName(value);

    const renderImagePreview = (renderImageProps) => {
        return (
            <div {...renderImageProps} {...imagePreviewProps}>
                {plugin.render({ file: null })}
                <div className={fileLabel}>{fileName}</div>
            </div>
        );
    }
    return renderImagePreview;
};

const getFileName = (value) => {
    if (!value) {
        return "";
    }
    return value.split("/").pop();
}