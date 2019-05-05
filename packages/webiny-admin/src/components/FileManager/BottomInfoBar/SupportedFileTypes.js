// @flow
import React from "react";
import mime from "mime/lite";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

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
        <span>
            Showing following file extensions: {getUniqueFileExtensions(accept).join(", ")}.
        </span>
    );
};

export default SupportedFileTypes;
