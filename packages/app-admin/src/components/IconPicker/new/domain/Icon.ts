export enum IconType {
    ICON = "icon",
    EMOJI = "emoji",
    CUSTOM = "custom"
}

export interface IconDTO {
    type: IconType;
    name: string;
    value: string;
    color?: string;
    skinTone?: string;
    width?: number;
}
