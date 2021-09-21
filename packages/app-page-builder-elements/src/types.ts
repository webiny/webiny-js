export type PageElement = {
    id: string;
    type: string;
    data: PageElementData;
    elements: PageElement[];
};

export type PageElementData = {
    type: string;
    settings?: Record<string, any>;
    [key: string]: any;
};

export type Theme = {
    colors?: { [key: string]: string };
    elements?: { [key: string]: any };
};

export enum DisplayMode {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE_LANDSCAPE = "mobile-landscape",
    MOBILE_PORTRAIT = "mobile-portrait"
}
