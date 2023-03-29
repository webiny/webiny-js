import { Theme } from "~/types";

export const createTheme = (theme: Theme): Theme => {
    return { ...theme, styles: { ...theme.styles, typographyStyles:  }};
}
