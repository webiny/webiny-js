import React, { Fragment, useEffect, useState } from "react";
import { plugins } from "@webiny/plugins";
import { useCurrentTheme } from "~/hooks/useCurrentTheme";
import { ThemeSource } from "~/types";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";

export interface ThemeLoaderProps {
    themes: ThemeSource[];
    children?: React.ReactNode;
}

interface LoadThemeProps {
    theme: ThemeSource;
    children: React.ReactNode;
}

const LoadTheme: React.VFC<LoadThemeProps> = ({ theme, children }) => {
    const [loaded, setLoaded] = useState(false);
    const { loadThemeFromPlugins } = usePageBuilder();

    useEffect(() => {
        theme.load().then(pluginFactory => {
            plugins.register(pluginFactory());
            loadThemeFromPlugins();
            setLoaded(true);
        });
    }, []);

    return loaded ? <Fragment>{children}</Fragment> : null;
};

export const ThemeLoader: React.VFC<ThemeLoaderProps> = ({ themes, children }) => {
    const themeName = useCurrentTheme();

    const theme = themes.find(th => th.name === themeName);
    return theme ? <LoadTheme theme={theme}>{children}</LoadTheme> : null;
};
