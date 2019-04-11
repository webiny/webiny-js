// @flow
import React from "react";

export default {
    name: "file-manager-file-type-default",
    type: "file-manager-file-type",
    render(file: Object) {
        return <span>{file.name}</span>;
    }
};
