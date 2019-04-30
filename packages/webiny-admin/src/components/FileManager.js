// @flow
import React, { useState } from "react";
import ReactDOM from "react-dom";
import FileManagerView from "./FileManager/FileManagerView";

type Props = {
    onChange: Function,
    images?: boolean,
    multiple?: boolean,
    accept?: Array<string>,
    children: ({ showFileManger: Function }) => React.Node
};

class FileManagerPortal extends React.Component<*> {
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
        const { onChange, onClose, accept, multiple, images } = this.props;
        const container: Element = (this.container: any);

        const props = {
            onChange,
            onClose,
            accept,
            multiple
        };

        if (images) {
            props.accept = ["image/jpg", "image/jpeg", "image/gif", "image/png", "image/svg+xml"];
        }

        // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
        return ReactDOM.createPortal(<FileManagerView {...props} />, container);
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
