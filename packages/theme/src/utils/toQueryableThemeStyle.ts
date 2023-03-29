import { ThemeStyles } from "~/types";
import {QueryableThemeStyle} from "~/utils/themeStyleFactory";
import {isQueryableThemeStyle} from "~/utils/isQueryableThemeStyle";

/*
* @desc: Converts the theme style to queryable style object.
* Returns null if theme style can't be converted to queryable object.
* */
const toQueryableThemeStyle = (themeStyles: ThemeStyles, themeStyleKey: string): QueryableThemeStyle | null => {
    if(!isQueryableThemeStyle(themeStyleKey)) {
        return null;
    }
    const style = themeStyles[themeStyleKey];
    if(!style) { return null; }
    return new QueryableThemeStyle(themeStyleKey, style);
}
