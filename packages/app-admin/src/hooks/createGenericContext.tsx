import React, { createContext } from "react";

export type CreateGenericContext<T = any> = T;

type GenericContextProviderProps<T> = T & {
    children: React.ReactNode;
};

export function createGenericContext<T>(name: string) {
    const GenericContext = createContext<CreateGenericContext | undefined>(undefined);

    function Provider({ children, ...props }: GenericContextProviderProps<T>) {
        return <GenericContext.Provider value={props}>{children}</GenericContext.Provider>;
    }

    Provider.displayName = `${name}Provider`;

    return {
        Provider,
        useHook: () => {
            const context = React.useContext<CreateGenericContext<T>>(
                GenericContext as unknown as React.Context<CreateGenericContext<T>>
            );

            if (!context) {
                throw Error(`Context provider for "${name}" is missing in the component tree!`);
            }

            return context;
        }
    };
}
