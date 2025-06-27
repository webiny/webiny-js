import React from "react";
import { Tree } from "@webiny/admin-ui";
import { FolderNode } from "../Node";

type NodePreviewProps = {
    text: string;
};

export const NodePreview = ({ text }: NodePreviewProps) => {
    return (
        <Tree.Item
            className={"wby-bg-neutral-dark/10 wby-absolute wby-z-[100]"}
            style={{ maxWidth: 256 }}
        >
            <FolderNode text={text} isRoot={false} />
        </Tree.Item>
    );
};
