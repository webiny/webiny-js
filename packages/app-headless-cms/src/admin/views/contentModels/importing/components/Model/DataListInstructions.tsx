import React from "react";
import styled from "@emotion/styled";

const Instructions = styled("div")({
    fontSize: "0.8rem",
    margin: "10px 0"
});

export const DataListInstructions = () => {
    return (
        <Instructions>
            <h4>Instructions</h4>
            <p>
                To learn how to use the import functionality, please visit{" "}
                <a href="https://www.webiny.com/docs/user-guides/headless-cms/advanced/import-export-content-models">
                    this article
                </a>
                .
            </p>
        </Instructions>
    );
};
