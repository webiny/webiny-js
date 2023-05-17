import React from "react";
import { FoldersProvider as FoldersContextProvider } from "./folders";
import { SearchRecordsProvider as SearchRecordsContextProvider } from "./records";
import { AcoAppProvider } from "~/contexts/app";

interface Props {
    children: React.ReactNode;
    id: string;
}
export const AcoProvider: React.VFC<Props> = ({ children, id }) => {
    return (
        <AcoAppProvider id={id}>
            <FoldersContextProvider>
                <SearchRecordsContextProvider>{children}</SearchRecordsContextProvider>
            </FoldersContextProvider>
        </AcoAppProvider>
    );
};
