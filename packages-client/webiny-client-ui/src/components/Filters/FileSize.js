import React from "react";
import { createComponent } from "webiny-client";
import filesize from "filesize";

class FileSize extends React.Component {
    render() {
        return <span>{filesize(this.props.value, this.props.options)}</span>;
    }
}

FileSize.defaultProps = {
    options: {}
};

export default createComponent(FileSize);
