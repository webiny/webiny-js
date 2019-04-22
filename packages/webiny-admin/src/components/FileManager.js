// @flow
import React, { useState } from "react";
import ReactDOM from "react-dom";
import type { FilesRules } from "react-butterfiles";
import FileManagerView from "./FileManager/FileManagerView";
import get from "lodash/get";

type Props = {
    onChange: Function,
    files: FilesRules,
    images?: boolean,
    children: ({ showFileManger: Function }) => React.Node
};

class FileManagerPortal extends React.Component<> {
    constructor() {
        super();

        this.container = document.getElementById("file-manager-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "file-manager-container");
            const container: Element = (this.container: any);
            document.body && document.body.appendChild(container);
        }
    }

    render() {
        const { onChange, onClose, files, images } = this.props;
        const container: Element = (this.container: any);
        const accept = get(files, "selection.accept") || [];

        if (images) {
            accept.push("image/jpg", "image/jpeg", "image/gif", "image/png");
        }

        // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
        return ReactDOM.createPortal(
            <FileManagerView onChange={onChange} files={{ ...files, accept }} onClose={onClose} />,
            container
        );
    }
}

function FileManager({ children, ...rest }: Props) {
    const [show, setShow] = useState(false);
    return (
        <>
            {show && <FileManagerPortal onClose={() => setShow(false)} {...rest} />}
            {children({
                showFileManager: () => setShow(true)
            })}
        </>
    );
}

FileManager.defaultProps = {
    files: {}
};

export { FileManager };
