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
    "> div": {
        border: "1px solid gray",
        width: 240,
        height: 240,
        overflow: "hidden",
        ".checkedIcon": {
            color: "var(--mdc-theme-secondary, #00ccb0)",
            position: "absolute",
            top: 0,
            left: 0
        }
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
            <div>
                <div className={"checkedIcon"}>{selected ? <Checked /> : <NotChecked />}</div>
                <div className={"filePreview"}>{children}</div>
            </div>
            {file.name}
        </div>
    );
}
