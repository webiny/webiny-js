import * as React from "react";
import { type VariantProps } from "~/utils.js";
import type { filePickerVariants } from "~/FilePicker/index.js";
import type { FilePreviewDefaultProps } from "../types.js";
import { RichItemPreview } from "../previews/index.js";

type FilePreviewProps = FilePreviewDefaultProps & {
    type: VariantProps<typeof filePickerVariants>["type"];
    renderFilePreview?: (props: any) => React.ReactElement<any>;
};

const FilePreview = ({ type, renderFilePreview, ...props }: FilePreviewProps) => {
    if (typeof renderFilePreview === "function") {
        return renderFilePreview({ type, ...props });
    }

    return <RichItemPreview {...props} />;
};

export { FilePreview, type FilePreviewProps };
