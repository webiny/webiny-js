import React from "react";
import { Tree } from "@webiny/admin-ui";
import { FolderNode } from "../Node/index.js";

type NodePreviewProps = {
    text: string;
};

export const NodePreview = ({ text }: NodePreviewProps) => {
    return (
        <Tree.Item className={"bg-neutral-dark/10 absolute z-[100]"} style={{ maxWidth: 256 }}>
            <FolderNode text={text} isRoot={false} />
        </Tree.Item>
    );
};
