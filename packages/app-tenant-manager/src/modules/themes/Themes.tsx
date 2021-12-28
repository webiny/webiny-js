// import React from "react";
import { useThemeManager } from "~/hooks/useThemeManager";

export const Themes = () => {
    const { themes } = useThemeManager();
    console.log(themes);
    return null;
};
