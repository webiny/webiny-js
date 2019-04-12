// @flow
import React, { useState } from "react";
import type { FilesRules } from "react-butterfiles";
import FileManagerView from "./FileManager/FileManagerView";

type Props = {
    onChange: Function,
    files: FilesRules,
    children: ({ showFileManger: Function }) => React.Node
};

function FileManager({ onChange, files, children }: Props) {
    const [show, setShow] = useState(false);

    return (
        <>
            {show && (
                <FileManagerView onChange={onChange} files={files} onClose={() => setShow(false)} />
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
