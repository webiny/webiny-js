import React from "react";
import { LinkComponent } from "./LinkComponent";

export const DefaultLinkComponent: LinkComponent = props => {
    return <a {...props} />;
};
