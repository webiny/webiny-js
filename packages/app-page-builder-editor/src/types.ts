import { ReactNode } from "react";
import { Plugin } from "@webiny/app/types";

export type PbElementDataSettingsSpacingValueType = {
    all?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
};
export type PbElementDataSettingsBackgroundType = {
    color?: string;
    image?: {
        scaling?: string;
        position?: string;
        file?: {
            src?: string;
        };
    };
};
export type PbElementDataSettingsMarginType = {
    advanced?: boolean;
    mobile?: PbElementDataSettingsSpacingValueType;
    desktop?: PbElementDataSettingsSpacingValueType;
};
export type PbElementDataSettingsPaddingType = {
    advanced?: boolean;
    mobile?: PbElementDataSettingsSpacingValueType;
    desktop?: PbElementDataSettingsSpacingValueType;
};
export type PbElementDataSettingsBorderType = {
    width?:
        | number
        | {
              all?: number;
              top?: number;
              right?: number;
              bottom?: number;
              left?: number;
          };
    style?: "none" | "solid" | "dashed" | "dotted";
    radius?:
        | number
        | {
              all?: number;
              topLeft?: number;
              topRight?: number;
              bottomLeft?: number;
              bottomRight?: number;
          };
    borders?: {
        top?: boolean;
        right?: boolean;
        bottom?: boolean;
        left?: boolean;
    };
};

export interface PbParagraphElementPerDeviceData {
    type?: string;
    color?: string;
    alignment: string;
    typography: string;
    tag: string;
}

export interface PbElementDataTextType
    extends PbPerDeviceSettings<PbParagraphElementPerDeviceData> {
    data: {
        text: string;
    };
}
export type PbElementDataImageType = {
    width?: string | number;
    height?: string | number;
    file?: {
        id?: string;
        src?: string;
    };
    title?: string;
};
export type PbElementDataIconType = {
    id?: [string, string];
    width?: number;
    color?: string;
    svg?: string;
    position?: string;
};
export type PbElementDataSettingsFormType = {
    parent?: string;
    revision?: string;
};
export enum AlignmentTypesEnum {
    HORIZONTAL_LEFT = "horizontalLeft",
    HORIZONTAL_CENTER = "horizontalCenter",
    HORIZONTAL_RIGHT = "horizontalRight",
    VERTICAL_TOP = "verticalTop",
    VERTICAL_CENTER = "verticalCenter",
    VERTICAL_BOTTOM = "verticalBottom"
}
export interface PbElementDataSettingsType
    extends PbPerDeviceSettings<{
        alignment?: AlignmentTypesEnum;
        horizontalAlign?: any; //"left" | "center" | "right" | "justify";
        horizontalAlignFlex?: any; //"flex-start" | "center" | "flex-end";
        verticalAlign?: "start" | "center" | "end";
        margin?: PbElementDataSettingsMarginType;
        padding?: PbElementDataSettingsPaddingType;
        height?: {
            value?: number;
        };
        background?: PbElementDataSettingsBackgroundType;
        border?: PbElementDataSettingsBorderType;
        grid?: {
            cellsType?: string;
            size?: number;
        };
        columnWidth?: {
            value?: string;
        };
        width?: {
            value?: string;
        };
        className?: string;
        form?: PbElementDataSettingsFormType;
    }> {
    [key: string]: any;
}

export interface PbPerDeviceSettings<TData> {
    [DisplayMode.DESKTOP]?: TData;
    [DisplayMode.TABLET]?: TData;
    [DisplayMode.MOBILE_PORTRAIT]?: TData;
    [DisplayMode.MOBILE_LANDSCAPE]?: TData;
}

export type PbElementDataType = {
    settings?: PbElementDataSettingsType;
    text?: PbElementDataTextType;
    image?: PbElementDataImageType;
    buttonText?: string;
    link?: {
        href?: string;
        newTab?: boolean;
    };
    type?: string;
    icon?: PbElementDataIconType;
    source?: {
        url?: string;
    };
    oembed?: {
        source?: {
            url?: string;
        };
        html?: string;
    };
    width?: number;
    [key: string]: any;
};

export type PbEditorElement = {
    id: string;
    type: string;
    data: PbElementDataType;
    parent?: string;
    elements: (string | PbEditorElement)[];
    // A helper value for React; not stored into DB.
    isHighlighted?: boolean;
    [key: string]: any;
};

export type PbElement = {
    id: string;
    type: string;
    data: PbElementDataType;
    elements: PbElement[];
};

export type PbPageData = {
    id: string;
    path: string;
    title?: string;
    content: any;
    settings?: {
        general?: {
            layout?: string;
        };
        seo?: {
            title: string;
            description: string;
            meta: { name: string; content: string }[];
        };
        social?: {
            title: string;
            description: string;
            meta: { property: string; content: string }[];
            image: {
                src: string;
            };
        };
    };
};

// export type PbEditorPageElementPlugin = Plugin & {
//     type: "pb-editor-page-element";
//     elementType: string;
//     toolbar?: {
//         // Element title in the toolbar.
//         title?: string | PbEditorPageElementTitle;
//         // Element group this element belongs to.
//         group?: string;
//         // A function to render an element preview in the toolbar.
//         preview?: React.ReactElement;
//     };
//     // Help link
//     help?: string;
//     // Whitelist elements that can accept this element (for drag&drop interaction)
//     target?: string[];
//     // Array of element settings plugin names.
//     settings?: Array<string | Array<string | any>>;
//     // A function to create an element data structure.
//     create: (
//         options: { [key: string]: any },
//         parent?: PbEditorElement
//     ) => Omit<PbEditorElement, "id">;
//     // A function to render an element in the editor.
//     render: (params: { theme?: PbTheme; element: PbEditorElement; isActive: boolean }) => ReactNode;
//     // A function to check if an element can be deleted.
//     canDelete?: (params: { element: PbEditorElement }) => boolean;
//     // Executed when another element is dropped on the drop zones of current element.
//     onReceived?: (params: { event: DropElementActionEvent }) => void;
//     // Executed when an immediate child element is deleted
//     onChildDeleted?: (params: {
//         element: PbEditorElement;
//         child: PbEditorElement;
//     }) => PbEditorElement | undefined;
//     // Executed after element was created
//     onCreate?: string;
//     // Render element preview (used when creating element screenshots; not all elements have a simple DOM representation
//     // so this callback is used to customize the look of the element in a PNG image)
//     renderElementPreview?: (params: {
//         element: PbEditorElement;
//         width: number;
//         height: number;
//     }) => ReactElement;
// };

// export type PbEditorPageElementActionPlugin = Plugin & {
//     type: "pb-editor-page-element-action";
//     render: (params: { element: PbEditorElement; plugin: PbEditorPageElementPlugin }) => ReactNode;
// };

export type PbPageDetailsPlugin = Plugin & {
    render: (params: { [key: string]: any }) => ReactNode;
};
//
// export type PbEditorPageSettingsPlugin = Plugin & {
//     type: "pb-editor-page-settings";
//     /* Settings group title */
//     title: string;
//     /* Settings group description */
//     description: string;
//     /* Settings group icon */
//     icon: ReactNode;
//     /* Render function that handles the specified `fields` */
//     render: (params: {
//         data: Record<string, any>;
//         setValue: FormSetValue;
//         form: Form;
//         Bind: BindComponent;
//     }) => ReactNode;
// };

// export type PbEditorBlockPlugin = Plugin & {
//     type: "pb-editor-block";
//     title: string;
//     category: string;
//     tags: string[];
//     image: {
//         src?: string;
//         meta: {
//             width: number;
//             height: number;
//             aspectRatio: number;
//         };
//     };
//     create(): PbEditorElement;
//     preview(): ReactElement;
// };

export enum DisplayMode {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE_LANDSCAPE = "mobile-landscape",
    MOBILE_PORTRAIT = "mobile-portrait"
}

// export type PbEditorElementPluginArgs = {
//     create?: (defaultValue) => Record<string, any>;
//     settings?: (defaultValue) => Array<string | Array<string | any>>;
//     toolbar?: (defaultValue) => Record<string, any>;
//     elementType?: string;
// };
//
// export type PbRenderElementPluginArgs = {
//     elementType?: string;
// };
