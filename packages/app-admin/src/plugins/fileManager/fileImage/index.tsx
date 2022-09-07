import * as React from "react";
import { css } from "emotion";
import { Image } from "@webiny/app/components";

import EditAction from "./EditAction";
import { FileManagerFileTypePlugin } from "~/plugins/FileManagerFileTypePlugin";

const styles = css({
    maxHeight: 200,
    maxWidth: 200,
    width: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translateX(-50%) translateY(-50%)"
});

export const imageFileTypePlugin = new FileManagerFileTypePlugin({
    types: ["image/*"],
    actions: [EditAction],
    render({ file }) {
        return (
            <Image className={styles} src={file.src} alt={file.name} transform={{ width: 300 }} />
        );
    }
});
