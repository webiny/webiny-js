import React, { FC, Fragment, useEffect, useState } from "react";
import { plugins } from "@webiny/plugins";
import { useCurrentTheme } from "~/hooks/useCurrentTheme";

export interface ThemeSource {
    name: string;
    label?: string;
    load: () => Promise<any>;
}

export interface ThemeLoaderProps {
    themes: ThemeSource[];
}

interface LoadThemeProps {
    theme: ThemeSource;
}

const LoadTheme: FC<LoadThemeProps> = ({ theme, children }) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        theme.load().then(pluginFactory => {
            plugins.register(pluginFactory());
            setLoaded(true);
        });
    }, []);

    return loaded ? <Fragment>{children}</Fragment> : null;
};

export const ThemeLoader: FC<ThemeLoaderProps> = ({ themes, children }) => {
    const theme = useCurrentTheme();

    return theme ? (
        <LoadTheme theme={themes.find(th => th.name === theme)}>{children}</LoadTheme>
    ) : null;
};
