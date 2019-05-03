// @flow
import React from "react";
import mime from "mime/lite";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

import styled from "react-emotion";

const Wrapper = styled("div")({
    fontSize: "0.8rem",
    color: "var(--mdc-theme-on-surface)",
    "> div": {
        display: "inline-block",
        margin: "0 5px"
    }
});

const getUniqueFileExtensions = accept => {
    const exts = {};
    accept.forEach(item => {
        exts[mime.getExtension(item)] = true;
    });

    console.log(accept)
    return Object.keys(exts);
};

const SupportedFileTypes = ({ accept }: *) => {
    if (!accept) {
        return null;
    }

    return (
        <Wrapper>
            Showing following file extensions:{" "}
            {getUniqueFileExtensions(accept).join(", ")}.
        </Wrapper>
    );
};

export default SupportedFileTypes;
