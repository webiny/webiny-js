import React from "react";
import { FormComponentProps } from "./../types";
export declare type MenuButtonProps = {
    className?: string;
    onClick?: (e: React.SyntheticEvent) => void;
    active?: boolean;
    children: React.ReactNode;
    onMouseDown?: (e: React.SyntheticEvent) => void;
};
export declare const MenuButton: React.FC<MenuButtonProps>;
export declare type MenuProps = FormComponentProps & {
    editor: any;
    activePlugin?: {
        [key: string]: any;
    };
    activatePlugin: Function;
    deactivatePlugin: Function;
    plugins: {
        [key: string]: any;
    }[];
};
export declare class Menu extends React.Component<MenuProps> {
    menu: React.RefObject<unknown>;
    render(): JSX.Element;
}
