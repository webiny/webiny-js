import React, { useMemo } from "react";
import { Theme } from "@webiny/app-theme/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { mediaToContainer } from "./mediaToContainer";
import { PageElementsProvider } from "~/contexts/PageBuilder/PageElementsProvider";
import styled from "@emotion/styled";

const ResponsiveContainer = styled.div`
    container-type: inline-size;
    container-name: page-canvas;
`;

export const ResponsiveElementsProvider = ({ children }: { children: React.ReactNode }) => {
    const pageBuilder = usePageBuilder();

    // We override all `@media` usages in breakpoints with `@container page-canvas`. This is what
    // enables us responsive design inside the Page Builder's page editor.
    const containerizedTheme = useMemo(() => {
        const theme = pageBuilder.theme as Theme;

        // On a couple of occasions, we've seen the `theme` object being `null` for a brief moment. This
        // would happen when the theme is being loaded via a dynamic import, e.g. in a multi-theme setup.
        if (!theme) {
            return null;
        }

        return {
            ...pageBuilder.theme,
            breakpoints: {
                ...theme.breakpoints,
                ...Object.keys(theme.breakpoints).reduce((result, breakpointName) => {
                    const breakpoint = theme.breakpoints[breakpointName];
                    return {
                        ...result,
                        [breakpointName]: mediaToContainer(breakpoint)
                    };
                }, {})
            }
        } as Theme;
    }, [pageBuilder.theme]);

    return (
        <ResponsiveContainer>
            <PageElementsProvider theme={containerizedTheme!}>{children}</PageElementsProvider>
        </ResponsiveContainer>
    );
};
