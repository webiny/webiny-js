import React from "react";
import { Component } from "webiny-client";
import filesize from "filesize";

@Component()
class FileSize extends React.Component {
    render() {
        return <span>{filesize(this.props.value, this.props.options)}</span>;
    }
}

FileSize.defaultProps = {
    options: {}
};

export default FileSize;
