// @flow
import React from "react";
import { Icon } from "webiny-ui/Icon";
import { Link } from "webiny-app/router";
import styled from "react-emotion";

import { ReactComponent as Pen } from "./icons/round-edit-24px.svg";
import { ReactComponent as Delete } from "./icons/round-delete-24px.svg";
import { ReactComponent as LinkIcon } from "./icons/round-link-24px.svg";
import { ReactComponent as FolderIcon } from "./icons/round-folder-24px.svg";
import { ReactComponent as PageIcon } from "./icons/round-subject-24px.svg";
import { ReactComponent as PagesIcon } from "./icons/round-format_list_bulleted-24px.svg";

const icons = {
    link: <Icon icon={<LinkIcon />} />,
    folder: <Icon icon={<FolderIcon />} />,
    page: <Icon icon={<PageIcon />} />,
    pagesList: <Icon icon={<PagesIcon />} />
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
