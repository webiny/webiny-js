// @flow
import React from "react";
import { css } from "emotion";
import { ReactComponent as Checked } from "./icons/round-check_box-24px.svg";
import { ReactComponent as NotChecked } from "./icons/round-check_box_outline_blank-24px.svg";

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
        },
        // Custom:
        ".filePreview": {
            img: {
                width: "100%"
            }
        }
    }
});

type Props = {
    file: Object,
    selected: boolean,
    onClick: Function
};

export default function File(props: Props) {
    const { file, selected, onClick } = props;

    return (
        <div className={styles} onClick={onClick}>
            <div>
                <div className={"checkedIcon"}>{selected ? <Checked /> : <NotChecked />}</div>
                <div className={"filePreview"}>
                    <img src={file.src} alt="" />
                </div>
            </div>

            {file.name}
        </div>
    );
}
