import * as React from "react";
import { LinkComponent } from "~/types";

export const DefaultLinkComponent: LinkComponent = props => {
    return <a rel={"noreferrer"} {...props} />;
};
