// @flow
import React from "react";
import mime from "mime/lite";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

import styled from "react-emotion";

const Wrapper = styled("div")({
    fontSize: "0.8rem",
    "> div": {
        display: "inline-block",
        margin: "0 5px"
    },
    position: "sticky",
    bottom: 0,
    height: 30,
    paddingLeft: 15,
    color: "var(--mdc-theme-text-secondary-on-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-surface)",
    width: "100%",
    transform: "translateZ(0)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    zIndex: 1
});

const getUniqueFileExtensions = accept => {
    const exts = {};
    accept.forEach(item => {
        exts[mime.getExtension(item)] = true;
    });

    return Object.keys(exts);
};

const SupportedFileTypes = ({ accept }: *) => {
    if (!accept) {
        return null;
    }

    return (
        <Wrapper>
            Showing following file extensions: {getUniqueFileExtensions(accept).join(", ")}.
        </Wrapper>
    );
};

export default SupportedFileTypes;
