// @flow
import React from "react";
import { css } from "emotion";
import { ReactComponent as Checked } from "./icons/round-check_box-24px.svg";
import { ReactComponent as NotChecked } from "./icons/round-check_box_outline_blank-24px.svg";
import classNames from "classnames";

const styles = css({
    display: "inline-block",
    float: "left",
    position: "relative",
    margin: 10,
    cursor: "pointer",
    width: 200,
    "> .body": {
        border: "1px solid #cccccc",
        width: 200,
        height: 200,
        overflow: "hidden",
        ".checkedIcon": {
            color: "var(--mdc-theme-secondary, #00ccb0)",
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 10
        },
        ".filePreview": {
            textAlign: "center",
            position: "relative"
        }
    },
    "> .label": {
        padding: "7px 0px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }
});

type Props = {
    file: Object,
    selected: boolean,
    onClick: Function
};

export default function File(props: Props) {
    const { file, selected, onClick, children, className } = props;

    return (
        <div className={classNames(styles, className)} onClick={onClick}>
            <div className={"body"}>
                <div className={"checkedIcon"}>{selected ? <Checked /> : <NotChecked />}</div>
                <div className={"filePreview"}>{children}</div>
            </div>
            <div className={"label"}>{file.name}</div>
        </div>
    );
}
