import React from "react";
import {
    List as RmwcList,
    ListProps as RmwcListProps,
    ListItem as RmwcListItem,
    ListItemProps as RmwcListItemProps,
    ListItemText as RmwcListItemText,
    ListItemTextProps as RmwcListItemTextProps,
    ListItemPrimaryText as RmwcListItemPrimaryText,
    ListItemSecondaryText as RmwcListItemSecondaryText,
    SimpleListItem as RmwcSimpleListItem,
    SimpleListItemProps as RmwcSimpleListItemProps
} from "@rmwc/list";
import { Typography } from "~/Typography";
import classNames from "classnames";
import styled from "@emotion/styled";

export type ListItemProps = RmwcListItemProps & {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
};

/**
 * ListItem components are placed as direct children to List component.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListItem = (props: ListItemProps) => {
    return <RmwcListItem {...props} />;
};

export type ListProps = RmwcListProps & {
    children?: any;

    className?: string;

    style?: React.CSSProperties;
};

/**
 * Use List component to display data and offer additional actions if needed.
 */
export class List extends React.Component<ListProps> {
    public override render() {
        return <RmwcList {...this.props}>{this.props.children}</RmwcList>;
    }
}

export type ListItemTextProps = RmwcListItemTextProps & {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

/**
 * Used to show regular text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListItemText = (props: ListItemTextProps) => {
    return <RmwcListItemText {...props}>{props.children}</RmwcListItemText>;
};

export type ListItemTextPrimaryProps = {
    /**
     * Text content
     */
    children: React.ReactNode;
};

export const ListItemTextPrimary = (props: ListItemTextPrimaryProps) => {
    return <RmwcListItemPrimaryText>{props.children}</RmwcListItemPrimaryText>;
};

export type ListItemTextSecondaryProps = {
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
export const ListItemTextSecondary = (props: ListItemTextSecondaryProps) => {
    return <RmwcListItemSecondaryText>{props.children}</RmwcListItemSecondaryText>;
};

export type ListItemGraphicProps = { children: React.ReactNode; className?: string };

/**
 * Can be used to show an icon or any other custom element. Rendered on the left side.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListItemGraphic = (props: ListItemGraphicProps) => {
    return (
        <div {...props} className={classNames("mdc-list-item__graphic", props.className)}>
            {props.children}
        </div>
    );
};

export type ListItemMetaProps = { children: React.ReactNode; className?: string };

/**
 * Can be used to show an icon or any other custom element. Rendered on the right side.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListItemMeta = (props: ListItemMetaProps) => {
    return (
        <span {...props} className={classNames("mdc-list-item__meta", props.className)}>
            {props.children}
        </span>
    );
};

export type ListTopCaptionProps = {
    children: React.ReactNode;
};

/**
 * Can be used to show a top caption inside ListItemMeta component.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListTopCaption = (props: ListTopCaptionProps) => {
    return (
        <span {...props} className={"webiny-list-top-caption"}>
            <Typography use="overline">{props.children}</Typography>
        </span>
    );
};

export type ListBottomCaptionProps = {
    children: React.ReactNode;
};

/**
 * Can be used to show a bottom caption inside ListItemMeta component.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListBottomCaption = (props: ListBottomCaptionProps) => {
    return (
        <span {...props} className={"webiny-list-bottom-caption"}>
            <Typography use="overline">{props.children}</Typography>
        </span>
    );
};

export type ListTextOverlineProps = {
    children: React.ReactNode;
};

/**
 * Can be used to show an overline text inside ListItem component.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListTextOverline = (props: ListTextOverlineProps) => {
    return (
        <span {...props} className={"webiny-list-text-overline"}>
            <Typography use="overline">{props.children}</Typography>
        </span>
    );
};

export type ListActionsProps = {
    children: React.ReactNode;
};

/**
 * Used to contain the actions inside ListItemMate component.
 * @param props
 * @returns {*}
 * @constructor
 */
export const ListActions = (props: ListActionsProps) => {
    return (
        <span {...props} className={"webiny-list-actions"}>
            {props.children}
        </span>
    );
};

const SelectBoxWrapper = styled("div")({
    overflow: "hidden",
    width: 25,
    height: 25,
    display: "flex",
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
});

export type ListSelectBoxProps = {
    children: React.ReactNode;
};

/**
 * Used to hold the Checkbox element for multi-select options.
 * @param {*} props
 */
export const ListSelectBox = (props: ListSelectBoxProps) => {
    return (
        <ListItemGraphic>
            <SelectBoxWrapper>{props.children}</SelectBoxWrapper>
        </ListItemGraphic>
    );
};

export const SimpleListItem = (props: RmwcSimpleListItemProps & { onClick?: any }) => {
    return <RmwcSimpleListItem {...props} />;
};
