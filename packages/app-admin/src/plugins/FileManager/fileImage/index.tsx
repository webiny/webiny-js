import * as React from "react";
import { css } from "emotion";
import { Image } from "@webiny/app/components";
import { FileManagerFileTypePlugin } from "@webiny/app-admin/types";

import EditAction from "./EditAction";

const styles = css({
    maxHeight: 200,
    maxWidth: 200,
    width: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translateX(-50%) translateY(-50%)"
});

const imageFilePlugin: FileManagerFileTypePlugin = {
    name: "file-manager-file-type-image",
    type: "file-manager-file-type",
    types: [
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/png",
        "image/svg+xml",
        "image/x-icon",
        "image/vnd.microsoft.icon"
    ],
    render({ file }) {
        return (
            <Image className={styles} src={file.src} alt={file.name} transform={{ width: 300 }} />
        );
    },
    fileDetails: {
        actions: [EditAction]
    }
};

export default imageFilePlugin;
