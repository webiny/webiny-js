import React from "react";
import { LinkComponent } from "./LinkComponent";

export const DefaultLinkComponent: LinkComponent = ({ to, ...props }) => {
    return <a href={to} {...props} />;
};
