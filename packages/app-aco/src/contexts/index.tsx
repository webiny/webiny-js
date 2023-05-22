import React from "react";
import { AcoAppProvider } from "~/contexts/app";

interface Props {
    children: React.ReactNode;
    id: string;
}
export const AcoProvider: React.VFC<Props> = ({ children, id }) => {
    return <AcoAppProvider id={id}>{children}</AcoAppProvider>;
};
