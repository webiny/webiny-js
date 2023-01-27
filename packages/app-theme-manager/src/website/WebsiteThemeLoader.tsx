import React from "react";
import { ThemeLoader as ThemeLoaderComponent } from "~/components/ThemeLoader";
import { ThemeSource } from "~/types";
import { createProviderPlugin } from "@webiny/app";

const createThemeLoader = (themes: ThemeSource[]) => {
    return createProviderPlugin(PrevProvider => {
        return function ThemeLoaderProvider({ children }) {
            return (
                <ThemeLoaderComponent themes={themes}>
                    <PrevProvider>{children}</PrevProvider>
                </ThemeLoaderComponent>
            );
        };
    });
};

export interface WebsiteThemeLoaderProps {
    themes: ThemeSource[];
}

export const WebsiteThemeLoader = ({ themes }: WebsiteThemeLoaderProps) => {
    const ThemeLoader = createThemeLoader(themes);

    return <ThemeLoader />;
};
