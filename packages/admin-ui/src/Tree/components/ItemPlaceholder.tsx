import React from "react";
import { makeDecoratable } from "~/utils.js";

interface ItemPlaceholderProps {
    depth: number;
}

const BaseItemPlaceholder = ({ depth }: ItemPlaceholderProps) => {
    const left = depth * 20 + 20;

    return (
        <div
            className="w-full h-xxs bg-primary-muted absolute top-0 right-0"
            style={{ left }}
        />
    );
};

const ItemPlaceholder = makeDecoratable("TreeItemPlaceholder", BaseItemPlaceholder);

export { ItemPlaceholder, type ItemPlaceholderProps };
