import { DecoratedTheme, Theme } from "~/types";

function byId(this: Array<any>, id: string) {
    return this.find((item: any) => item.id === id);
}

export const createTheme = (theme: Theme): DecoratedTheme => {
    const typography = theme.styles.typography;
    Object.keys(typography).forEach(key => {
        // @ts-ignore
        typography[key].byId = byId.bind(typography[key]);
    });
    return { ...theme } as DecoratedTheme;
};
