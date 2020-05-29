import React from "react";

export const Leaf = ({ attributes, children, leaf }) => {
    return <span {...attributes}>{children}</span>;
};
