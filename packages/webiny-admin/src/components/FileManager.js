// @flow
import * as React from "react";
import ReactDOM from "react-dom";
import FileManagerView from "./FileManager/FileManagerView";
import pick from "lodash/pick";

type Props = {
    onChange: ?Function,
    images?: boolean,
    multiple?: boolean,
    accept?: Array<string>,
    children: ({ showFileManager: Function }) => React.Node,
    maxSize?: string,
    multipleMaxCount?: number,
    multipleMaxSize?: string
};

const { useState } = React;

class FileManagerPortal extends React.Component<*> {
    container: Element;
    constructor() {
        super();

        if (!window) {
            return;
        }

        this.container = window.document.getElementById("file-manager-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "file-manager-container");
            const container: Element = (this.container: any);
            document.body && document.body.appendChild(container);
        }
    }

    render() {
        const {
            onChange,
            onClose,
            accept,
            multiple,
            images,
            maxSize,
            multipleMaxCount,
            multipleMaxSize
        } = this.props;

        const container: Element = (this.container: any);

        const props = {
            onChange: files => {
                const fields = ["name", "src", "size", "type"];
                if (Array.isArray(files)) {
                    onChange(files.map(file => pick(file, fields)));
                } else {
                    onChange(pick(files, fields));
                }
            },
            onClose,
            accept,
            multiple,
            maxSize,
            multipleMaxCount,
            multipleMaxSize
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

export default FileManager;
