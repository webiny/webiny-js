import { useEffect } from "react";
import { useThemeManager } from "~/hooks/useThemeManager";

export interface AddThemeProps {
    name: string;
    label: string;
    load: () => Promise<any>;
}

export const AddTheme = (props: AddThemeProps) => {
    const { addTheme } = useThemeManager();

    useEffect(() => {
        return addTheme(props);
    }, []);

    return null;
};
