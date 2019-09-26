// @flow
import React from "react";
import { css } from "emotion";

const styles = css({
    padding: "100px 0px",
    textAlign: "center",
    position: "absolute",
    width: "100%"
});

export default function DropFilesHere() {
    return (
        <div className={styles}>
            <div>No results found.</div>
        </div>
    );
}
