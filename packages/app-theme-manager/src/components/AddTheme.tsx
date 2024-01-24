import React, { useEffect } from "react";
import { useThemeManager } from "~/hooks/useThemeManager";
import { ThemeSource } from "~/types";

export type AddThemeProps = ThemeSource;

export const AddTheme: React.ComponentType<AddThemeProps> = props => {
    const { addTheme } = useThemeManager();

    useEffect(() => {
        return addTheme(props);
    }, []);

    return null;
};
