// @flow
import * as React from "react";
import { List as RmwcList, ListItem as RmwcListItem } from "rmwc/List";

type Props = {
    // One or more List.Item components, which can then consist of the following components:
    // - List.Item.Text
    // - List.Item.Text.Secondary
    // - List.Item.Text.Graphic
    // - List.Item.Text.Meta
    children: React.ChildrenArray<React.Element<typeof List.Item>>
};

const List = (props: Props) => {
    return <RmwcList>{props.children}</RmwcList>;
};

/**
 * List.Item components are placed as direct children to List component.
 * @param props
 * @returns {*}
 * @constructor
 */
List.Item = function ListItem(props: {
    children: React.ChildrenArray<
        | React.Element<typeof List.Item.Text>
        | React.Element<typeof List.Item.Graphic>
        | React.Element<typeof List.Item.Meta>
    >
}) {
    return <RmwcListItem {...props} />;
};

/**
 * Used to show regular text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
List.Item.Text = function ListItemText(props: { children: React.Node }) {
    return <span className="mdc-list-item__text">{props.children}</span>;
};

/**
 * Used to show secondary text in list items.
 * @param props
 * @returns {*}
 * @constructor
 */
List.Item.Text.Secondary = function ListItemTextSecondary(props: { children: React.Node }) {
    return <span className="mdc-list-item__secondary-text">{props.children}</span>;
};

/**
 * Can be used to show an icon or any other custom element. Rendered on the left side.
 * @param props
 * @returns {*}
 * @constructor
 */
List.Item.Graphic = function ListItemGraphic(props: { children: React.Node }) {
    return <div className="mdc-list-item__graphic">{props.children}</div>;
};

/**
 * Can be used to show an icon or any other custom element. Rendered on the right side.
 * @param props
 * @returns {*}
 * @constructor
 */
List.Item.Meta = function ListItemMeta(props: { children: React.Node }) {
    return <span className="mdc-list-item__meta">{props.children}</span>;
};

export default List;
