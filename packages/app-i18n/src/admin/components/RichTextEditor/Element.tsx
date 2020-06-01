import React from "react";

export const Element = ({ attributes, children, element }) => {
    switch (element.type) {
        default:
            return <p {...attributes}>{children}</p>;
    }
};
