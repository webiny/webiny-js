import {
    QueryableThemeStyles,
    ThemeStyleItem, ThemeStyles,
} from "~/types";

export interface IQueryableStyleItem<T extends ThemeStyleItem> {
    readonly all: T[];
    readonly keyName: string;
    byId: (id: string) => T | undefined;
}

export class QueryableThemeStyle implements IQueryableStyleItem<ThemeStyleItem>{
    protected _styles: ThemeStyleItem[];
    protected _keyName: string;

    constructor(keyName: string, styles: ThemeStyleItem[]) {
        this._styles = styles;
        this._keyName = keyName;
        if(!this.hasStyles()) {
            console.log(`Please add at lease one item in ${this._keyName} , type: ${typeof styles}`);
        }
    }

    byId(id: string): ThemeStyleItem | undefined {
        return this._styles.find(x => x.id === id) ;
    }

    get all(): ThemeStyleItem[] {
        return this._styles;
    }

    get keyName(): string {
        return this._keyName;
    }

    hasStyles(): boolean {
      return !!this._styles.length;
    }
}

export const createQueryableThemeStyles = (themeStyles: ThemeStyles): QueryableThemeStyles => {
   /* const querableTypograpy: QueryableTypography;
    for (const key in typography)
          querableTypograpy[key] = new QueryableThemeStyle(typography[key]);
    }*/
}
