import React from "react";
import { ReactComponent as ShoppingBagIcon } from "webiny/admin/icons/shopping_bag.svg";

// A gradient tile with a bag icon, standing in for a product photo.
export const ProductThumbnail = ({ colors }: { colors: [string, string] }) => {
    return (
        <span
            aria-hidden
            className={"flex size-xl flex-none items-center justify-center rounded-md shadow-sm"}
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
        >
            <ShoppingBagIcon className={"size-md fill-white"} />
        </span>
    );
};
