import React, { Fragment, useEffect, useState } from "react";
import { plugins } from "@webiny/plugins";
import { useCurrentTheme } from "~/hooks/useCurrentTheme";
import { ThemeSource } from "~/types";
import { useTheme } from "@webiny/app-theme";

export interface ThemeLoaderProps {
    themes: ThemeSource[];
    children?: React.ReactNode;
}

interface LoadThemeProps {
    theme: ThemeSource;
    children: React.ReactNode;
}

const LoadTheme = ({ theme, children }: LoadThemeProps) => {
    const [loaded, setLoaded] = useState(false);
    const { loadThemeFromPlugins } = useTheme();

    useEffect(() => {
        theme.load().then(pluginFactory => {
            plugins.register(pluginFactory());
            loadThemeFromPlugins();
            setLoaded(true);
        });
    }, []);

    return loaded ? <Fragment>{children}</Fragment> : null;
};

export const ThemeLoader = ({ themes, children }: ThemeLoaderProps) => {
    const themeName = useCurrentTheme();

    const theme = themes.find(th => th.name === themeName);
    return theme ? <LoadTheme theme={theme}>{children}</LoadTheme> : null;
};
