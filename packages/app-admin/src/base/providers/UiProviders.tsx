import React from "react";
import { createProvider, SimpleLink } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { compiler } from "markdown-to-jsx/react";

const options = {
    overrides: {
        a: {
            component: ({ children, ...props }: any) => (
                <a {...props} target="_blank" rel="noopener noreferrer">
                    {children}
                </a>
            )
        }
    }
};

const markdownCompiler = (markdown: string) => {
    return compiler(markdown, options);
};

interface UiProvidersProps {
    children: React.ReactNode;
}

export const createUiProviders = () => {
    return createProvider(Component => {
        return function UiProviders({ children }: UiProvidersProps) {
            return (
                <AdminUiProvider linkComponent={SimpleLink} markdownCompiler={markdownCompiler}>
                    <Component>{children}</Component>
                </AdminUiProvider>
            );
        };
    });
};
