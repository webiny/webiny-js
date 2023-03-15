import * as React from "react";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/description.svg";
import { css } from "emotion";
import { FileManagerFileTypePlugin } from "~/plugins/FileManagerFileTypePlugin";

const style = {
    centering: css({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 200
    })
};

export const defaultFileTypePlugin = new FileManagerFileTypePlugin({
    types: ["*/*"],
    render(): React.ReactNode {
        return (
            <div className={style.centering}>
                <FileIcon />
            </div>
        );
    }
});
