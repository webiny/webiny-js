// @flow
import React from "react";
import { css } from "emotion";
import { ReactComponent as Checked } from "./icons/round-check_box-24px.svg";
import { ReactComponent as NotChecked } from "./icons/round-check_box_outline_blank-24px.svg";

const styles = css({
    border: "1px solid gray",
    width: 240,
    height: 240,
    display: "inline-block",
    margin: 10,
    cursor: "pointer",
    float: "left",
    "> div": {
        overflow: "hidden",
        img: {
            width: "100%"
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
                <div>{selected ? <Checked /> : <NotChecked />}</div>
                <img src={file.src} alt="" />
            </div>

            {file.name}
        </div>
    );
}
