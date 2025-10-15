import React from "react";
import { LinkComponent } from "./LinkComponent.js";

export const DefaultLinkComponent: LinkComponent = ({ to, ...props }) => {
    return <a href={to} {...props} />;
};
