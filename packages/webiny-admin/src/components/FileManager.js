// @flow
import React, { useState } from "react";
import type { FilesRules } from "react-butterfiles";
import FileManagerView from "./FileManager/FileManagerView";
import get from "lodash/get";

type Props = {
    onChange: Function,
    files: FilesRules,
    images?: boolean,
    children: ({ showFileManger: Function }) => React.Node
};

function FileManager({ onChange, files, children, images }: Props) {
    const [show, setShow] = useState(false);

    const accept = get(files, "selection.accept") || [];

    if (images) {
        accept.push("image/jpg", "image/jpeg", "image/gif", "image/png");
    }

    return (
        <>
            {show && (
                <FileManagerView
                    onChange={onChange}
                    files={{ ...files, accept }}
                    onClose={() => setShow(false)}
                />
            )}
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
