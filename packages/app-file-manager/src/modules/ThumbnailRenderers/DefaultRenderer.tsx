import * as React from "react";
import { css } from "emotion";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/outlined/description.svg";

const style = {
    centering: css({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 200
    })
};

export const DefaultRenderer = () => {
    return (
        <div className={style.centering}>
            <FileIcon />
        </div>
    );
};
