import React from "react";

type LeafProps = {
    attributes: any;
    children: any;
    leaf: any;
};

export const Leaf = ({ attributes, children }: LeafProps) => {
    return <span {...attributes}>{children}</span>;
};
