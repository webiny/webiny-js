// @flow
import React from "react";
import { Icon } from "webiny-ui/Icon";
import { Link } from "webiny-app/router";
import styled from "react-emotion";

import { ReactComponent as Pen } from "./icons/baseline-edit-24px.svg";
import { ReactComponent as Delete } from "./icons/baseline-delete-24px.svg";
import { ReactComponent as LinkIcon } from "./icons/baseline-link-24px.svg";
import { ReactComponent as Folder } from "./icons/baseline-folder-24px.svg";
import { ReactComponent as Page } from "./icons/file.svg";
import { ReactComponent as Pages } from "./icons/blank-page.svg";

const icons = {
    link: <Icon icon={<LinkIcon />} />,
    group: <Icon icon={<Folder />} />,
    page: <Icon icon={<Page />} />,
    pagesList: <Icon icon={<Pages />} />
};

const ItemTypeListItem = styled("li")({
    ".item-type-icon": {
        display: "inline-block",
        width: 24,
        height: 24
    }
});

const MenuItem = (props: *) => {
    const draggable = {
        "data-id": props.item.id,
        "data-title": props.item.title,
        draggable: true,
        onDragStart: props.onDragStart,
        onDragEnd: props.onDragEnd,
        "data-role": "item"
    };

    return (
        <ItemTypeListItem {...draggable}>
            <span>
                <Icon className="item-type-icon" icon={icons[props.item.type]} />
                {props.item.title}
                <Link onClick={() => props.onDelete(props.item.id)}>
                    <Icon icon={<Delete />} />
                </Link>
                <Link onClick={() => props.onEdit(props.item)}>
                    <Icon icon={<Pen />} />
                </Link>
            </span>
            <ul>
                {Array.isArray(props.item.items) &&
                    props.item.items.map((item, index) => {
                        const itemProps = {
                            ...draggable,
                            "data-id": item.id,
                            item,
                            index,
                            onDrop: props.onDrop,
                            onDelete: props.onDelete,
                            onEdit: props.onEdit
                        };

                        return <MenuItem key={index} {...itemProps} />;
                    })}
            </ul>
        </ItemTypeListItem>
    );
};

export default MenuItem;
