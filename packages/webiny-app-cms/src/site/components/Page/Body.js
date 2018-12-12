// @flow
import * as React from "react";

type Props = {
    children: React.Node
};

export default function Body({ children }: Props) {
    return <div className="webiny-cms-page">{children}</div>;
}
