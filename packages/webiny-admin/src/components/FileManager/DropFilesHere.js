// @flow
import React from "react";
import { css } from "emotion";

const styles = css({
    width: 300,
    height: 300,
    backgroundColor: "#e4e4e4",
    borderRadius: "50%",
    margin: "0 auto",
    textAlign: "center",
    position: "relative",
    "> div": {
        position: "absolute",
        top: 130,
        width: 300
    }
});

export default function DropFilesHere() {
    return (
        <div className={styles}>
            <div>
                <div>Drop files here</div>
                <span>or use the Upload button</span>
            </div>
        </div>
    );
}
