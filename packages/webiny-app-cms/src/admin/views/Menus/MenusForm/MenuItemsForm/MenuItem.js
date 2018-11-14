// @flow
import React from "react";
import { Icon } from "webiny-ui/Icon";
import { Link } from "webiny-app/router";

import { ReactComponent as Pen } from "./icons/baseline-edit-24px.svg";
import { ReactComponent as Delete } from "./icons/baseline-delete-24px.svg";

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
        <li {...draggable}>
            <span className="item">
                {/*<Icon icon={icons[props.item.type]} />*/}
                {props.item.title}
                {/*<ClickConfirm message="Are you sure you want to delete this menu item?">*/}
                <Link align="right" onClick={() => props.onDelete(props.item.id)}>
                    <Icon icon={<Delete />} />
                </Link>
                {/*</ClickConfirm>*/}
                <Link align="right" onClick={() => props.onEdit(props.item)}>
                    <Icon icon={<Pen />} />
                </Link>
            </span>
            <ul>
                {props.item.items &&
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
        </li>
    );
};

export default MenuItem;
