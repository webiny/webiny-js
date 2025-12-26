import { DiContainerProvider } from "@webiny/app";
import { useContainer } from "@webiny/app";
import type { ReactNode } from "react";
import React, { useContext, useMemo } from "react";
import { AcoAppContext } from "~/contexts/app.js";
import { FoldersFeature } from "~/features/folders/feature.js";

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

    const container = useContainer();

    const routeContainer = useMemo(() => {
        const childContainer = container.createChildContainer();

        FoldersFeature.register(childContainer, { type });

        return childContainer;
    }, []);

    const context = useMemo<FoldersContext>(() => {
        return {
            type
        };
    }, [type]);

    return (
        <DiContainerProvider container={routeContainer}>
            <FoldersContext.Provider value={context}>{children}</FoldersContext.Provider>
        </DiContainerProvider>
    );
};
