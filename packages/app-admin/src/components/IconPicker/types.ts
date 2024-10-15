/**
 * We want to have an abstract type, which does not define specifics of each possible icon (like color or skin tone).
 */
export type Icon = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    type: "icon" | "emoji" | "custom" | (string & {});
    name: string;
    value: string;
    [key: string]: any;
};

type IconsRow = {
    type: "icons";
    icons: Icon[];
};

type CategoryNameRow = {
    type: "category-name";
    name: string;
};

export type IconPickerGridRow = IconsRow | CategoryNameRow;

export enum ICON_PICKER_SIZE {
    SMALL = "small"
}
