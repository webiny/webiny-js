import React from "react";
import { createProvider, SimpleLink } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { compiler } from "markdown-to-jsx/react";
import { useAdminConfig } from "~/config/AdminConfig.js";

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
            const { fileUrlFormatter } = useAdminConfig();
            return (
                <AdminUiProvider
                    linkComponent={SimpleLink}
                    markdownCompiler={markdownCompiler}
                    fileUrlFormatter={fileUrlFormatter}
                >
                    <Component>{children}</Component>
                </AdminUiProvider>
            );
        };
    });
};
