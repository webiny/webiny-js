import React from "react";

type BaseAnchorAttributes = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export type LinkComponentProps = BaseAnchorAttributes & {
    to: string;
};

export type LinkComponent = React.ComponentType<LinkComponentProps>;
