import * as React from "react";
import { css } from "emotion";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/round/insert_drive_file.svg";

export const imagePlugins = [".jpg", ".jpeg", ".gif", ".png", ".svg", ".webp"];

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

interface CreateRenderImagePreviewProps {
    value: string;
    // TODO @ts-refactor figure out correct type
    imagePreviewProps: any;
}
interface RenderImageProps {
    [key: string]: string;
}
export const createRenderImagePreview = ({
    value,
    imagePreviewProps
}: CreateRenderImagePreviewProps) => {
    const fileName = getFileName(value);

    const renderImagePreview = (renderImageProps: RenderImageProps) => {
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

const getFileName = (value?: string): string => {
    if (!value) {
        return "unknown";
    }
    return value.split("/").pop() || "unknown";
};
