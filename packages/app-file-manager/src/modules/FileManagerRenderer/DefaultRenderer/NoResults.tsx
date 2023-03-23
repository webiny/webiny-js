import React from "react";
import { css } from "emotion";

const styles = css({
    padding: "100px 0px",
    textAlign: "center",
    position: "absolute",
    width: "100%"
});

const DropFilesHere: React.VFC = () => {
    return (
        <div className={styles}>
            <div>No results found.</div>
        </div>
    );
};
export default DropFilesHere;
