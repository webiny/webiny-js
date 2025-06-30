import React from "react";
import { makeDecoratable } from "~/utils";

interface ItemPlaceholderProps {
    depth: number;
}

const BaseItemPlaceholder = ({ depth }: ItemPlaceholderProps) => {
    const left = depth * 20 + 20;

    return (
        <div
            className="wby-w-full wby-h-xxs wby-bg-primary-muted wby-absolute wby-top-0 wby-right-0"
            style={{ left }}
        />
    );
};

const ItemPlaceholder = makeDecoratable("TreeItemPlaceholder", BaseItemPlaceholder);

export { ItemPlaceholder, type ItemPlaceholderProps };
