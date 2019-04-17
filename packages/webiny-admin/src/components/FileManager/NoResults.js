// @flow
import React from "react";
import { css } from "emotion";

const styles = css({
    padding: "100px",
    textAlign: "center",
    position: "relative"
});

export default function DropFilesHere() {
    return (
        <div className={styles}>
            <div>No results found.</div>
        </div>
    );
}
