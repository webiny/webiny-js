import React from "react";
import mime from "mime/lite";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

const getUniqueFilePlugins = accept => {
    const exts = {};
    accept.forEach(item => {
        exts[mime.getExtension(item)] = true;
    });

    return Object.keys(exts);
};

const SupportedFileTypes = ({ accept }) => {
    if (!accept) {
        return null;
    }

    if (accept.length === 0) {
        return <span>Showing all file extensions.</span>;
    }

    return (
        <span>
            Showing the following file extensions: {getUniqueFilePlugins(accept).join(", ")}.
        </span>
    );
};

export default SupportedFileTypes;
