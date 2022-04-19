import * as React from "react";
import { css } from "emotion";
import { ReactComponent as FileIcon } from "@webiny/app-admin/assets/icons/insert_drive_file-24px.svg";
import lodashSet from "lodash/set";
import lodashGet from "lodash/get";
import cloneDeep from "lodash/cloneDeep";
import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";

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

    const renderImagePreview = (renderImageProps: any) => {
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

const SAFE_TEXT_LENGTH = 140;

export const getTrimmedBody = (body: RichTextEditorProps["value"]) => {
    if (!Array.isArray(body) || body.length === 0) {
        return body;
    }
    /**
     * Extract first block and return it as the whole body.
     */
    const firstBlock = cloneDeep(body[0]);

    const text = lodashGet(firstBlock, "data.text");
    return [
        lodashSet(
            firstBlock,
            "data.text",
            text.length > SAFE_TEXT_LENGTH
                ? lodashGet(firstBlock, "data.text").substring(0, SAFE_TEXT_LENGTH) + "..."
                : text
        )
    ];
};
