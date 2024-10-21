import React, { ReactNode, useContext, useMemo } from "react";
import { AcoAppContext } from "~/contexts/app";

interface FoldersContext {
    type?: string | null;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

interface Props {
    type?: string;
    children: ReactNode;
}

export const FoldersProvider = ({ children, ...props }: Props) => {
    const appContext = useContext(AcoAppContext);

    const app = appContext ? appContext.app : undefined;

    const type = props.type ?? app?.id;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const context = useMemo<FoldersContext>(() => {
        return {
            type
        };
    }, [type]);

    return <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>;
};
