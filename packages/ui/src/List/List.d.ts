import * as React from "react";
import { ListItemProps as RmwcListItemProps, ListItemTextProps as RmwcListItemTextProps } from "@rmwc/list";
export declare type ListItemProps = RmwcListItemProps & {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
};
/**
 * ListItem components are placed as direct children to List component.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListItem: (props: ListItemProps) => JSX.Element;
export declare type ListProps = {
    children?: any;
    nonInteractive?: boolean;
    twoLine?: boolean;
    className?: string;
};
/**
 * Use List component to display data and offer additional actions if needed.
 */
export declare class List extends React.Component<ListProps> {
    render(): JSX.Element;
}
export declare type ListItemTextProps = RmwcListItemTextProps & {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.SyntheticEvent<MouseEvent>) => void;
};
/**
 * Used to show regular text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListItemText: (props: ListItemTextProps) => JSX.Element;
export declare type ListItemTextPrimaryProps = {
    /**
     * Text content
     */
    children: React.ReactNode;
};
export declare const ListItemTextPrimary: (props: ListItemTextPrimaryProps) => JSX.Element;
export declare type ListItemTextSecondaryProps = {
    /**
     * Text content
     */
    children: React.ReactNode;
};
/**
 * Used to show secondary text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListItemTextSecondary: (props: ListItemTextSecondaryProps) => JSX.Element;
export declare type ListItemGraphicProps = {
    children: React.ReactNode;
    className?: string;
};
/**
 * Can be used to show an icon or any other custom element. Rendered on the left side.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListItemGraphic: (props: ListItemGraphicProps) => JSX.Element;
export declare type ListItemMetaProps = {
    children: React.ReactNode;
    className?: string;
};
/**
 * Can be used to show an icon or any other custom element. Rendered on the right side.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListItemMeta: (props: ListItemMetaProps) => JSX.Element;
export declare type ListTopCaptionProps = {
    children: React.ReactNode;
};
/**
 * Can be used to show a top caption inside ListItemMeta component.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListTopCaption: (props: ListTopCaptionProps) => JSX.Element;
export declare type ListBottomCaptionProps = {
    children: React.ReactNode;
};
/**
 * Can be used to show a bottom caption inside ListItemMeta component.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListBottomCaption: (props: ListBottomCaptionProps) => JSX.Element;
export declare type ListTextOverlineProps = {
    children: React.ReactNode;
};
/**
 * Can be used to show an overline text inside ListItem component.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListTextOverline: (props: ListTextOverlineProps) => JSX.Element;
export declare type ListActionsProps = {
    children: React.ReactNode;
};
/**
 * Used to contain the actions inside ListItemMate component.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ListActions: (props: ListActionsProps) => JSX.Element;
export declare type ListSelectBoxProps = {
    children: React.ReactNode;
};
/**
 * Used to hold the Checkbox element for multi-select options.
 * @param {*} props
 */
export declare const ListSelectBox: (props: ListSelectBoxProps) => JSX.Element;
