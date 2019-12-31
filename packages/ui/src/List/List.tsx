import * as React from "react";
import {
    List as RmwcList,
    ListItem as RmwcListItem,
    ListItemText as RmwcListItemText,
    ListItemPrimaryText as RmwcListItemPrimaryText,
    ListItemSecondaryText as RmwcListItemSecondaryText
} from "@rmwc/list";
import { Typography } from "@webiny/ui/Typography";
import classNames from "classnames";
import styled from "@emotion/styled";

type ListItemProps = {
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
const ListItem = (props: ListItemProps) => {
    return <RmwcListItem {...props} />;
};

type Props = {
    // One or more ListItem components, which can then consist of the following components:
    // - ListItemText
    // - ListItemTextSecondary
    // - ListItemText.Graphic
    // - ListItemText.Meta
    children?: React.ReactElement<typeof ListItem>[] | React.ReactElement<any>[];

    // Sets the list as non-interactive
    nonInteractive?: boolean;

    // In case you are using a 2-line list, set this param to true
    twoLine?: boolean;

    className?: string;
};

/**
 * Use List component to display data and offer additional actions if needed.
 * @param props
 * @returns {*}
 * @constructor
 */
class List extends React.Component<Props> {
    render() {
        return <RmwcList {...this.props}>{this.props.children}</RmwcList>;
    }
}

type ListItemTextProps = { children: React.ReactNode; className?: string };

/**
 * Used to show regular text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListItemText = (props: ListItemTextProps) => {
    return <RmwcListItemText {...props}>{props.children}</RmwcListItemText>;
};

type ListItemTextPrimaryProps = { children: React.ReactNode };

const ListItemTextPrimary = (props: ListItemTextPrimaryProps) => {
    return <RmwcListItemPrimaryText>{props.children}</RmwcListItemPrimaryText>;
};

type ListItemTextSecondaryProps = { children: React.ReactNode };

/**
 * Used to show secondary text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListItemTextSecondary = (props: ListItemTextSecondaryProps) => {
    return <RmwcListItemSecondaryText>{props.children}</RmwcListItemSecondaryText>;
};

type ListItemGraphicProps = { children: React.ReactNode; className?: string };

/**
 * Can be used to show an icon or any other custom element. Rendered on the left side.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListItemGraphic = (props: ListItemGraphicProps) => {
    return (
        <div {...props} className={classNames("mdc-list-item__graphic", props.className)}>
            {props.children}
        </div>
    );
};

type ListItemMetaProps = { children: React.ReactNode; className?: string };

/**
 * Can be used to show an icon or any other custom element. Rendered on the right side.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListItemMeta = (props: ListItemMetaProps) => {
    return (
        <span {...props} className={classNames("mdc-list-item__meta", props.className)}>
            {props.children}
        </span>
    );
};

type ListTopCaptionProps = {
    children: React.ReactNode;
};

/**
 * Can be used to show a top caption inside ListItemMeta component.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListTopCaption = (props: ListTopCaptionProps) => {
    return (
        <span {...props} className={"webiny-list-top-caption"}>
            <Typography use="overline">{props.children}</Typography>
        </span>
    );
};

type ListBottomCaptionProps = {
    children: React.ReactNode;
};

/**
 * Can be used to show a bottom caption inside ListItemMeta component.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListBottomCaption = (props: ListBottomCaptionProps) => {
    return (
        <span {...props} className={"webiny-list-bottom-caption"}>
            <Typography use="overline">{props.children}</Typography>
        </span>
    );
};

type ListTextOverlineProps = {
    children: React.ReactNode;
};

/**
 * Can be used to show an overline text inside ListItem component.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListTextOverline = (props: ListTextOverlineProps) => {
    return (
        <span {...props} className={"webiny-list-text-overline"}>
            <Typography use="overline">{props.children}</Typography>
        </span>
    );
};

type ListActionsProps = {
    children: React.ReactNode;
};

/**
 * Used to contain the actions inside ListItemMate component.
 * @param props
 * @returns {*}
 * @constructor
 */
const ListActions = (props: ListActionsProps) => {
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

type ListSelectBoxProps = {
    children: React.ReactNode;
};

/**
 * Used to hold the Checkbox element for multi-select options.
 * @param {*} props
 */
const ListSelectBox = (props: ListSelectBoxProps) => {
    return (
        <ListItemGraphic>
            <SelectBoxWrapper>{props.children}</SelectBoxWrapper>
        </ListItemGraphic>
    );
};

export {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemGraphic,
    ListItemMeta,
    ListTopCaption,
    ListActions,
    ListBottomCaption,
    ListTextOverline,
    ListSelectBox
};
