// @flow
import React from "react";
import { css } from "emotion";

const styles = css({
    height: 200,
    width: "auto"
});

export default [
    {
        name: "file-manager-file-type-image",
        type: "file-manager-file-type",
        types: ["image/jpeg", "image/jpg", "image/gif", "image/png"],
        render(file: Object) {
            return <img className={styles} src={file.src} alt={file.name} />;
        }
    },
    {
        name: "file-manager-file-type-default",
        type: "file-manager-file-type",
        render(file: Object) {
            return <span>{file.name}</span>;
        }
    }
];
