import React from "react";
import { List } from "webiny/admin/ui";
import { Tag } from "webiny/admin/ui";
import { Text } from "webiny/admin/ui";
import { Widget } from "webiny/admin/ui";
import { ReactComponent as ShoppingBagIcon } from "webiny/admin/icons/shopping_bag.svg";
import { ProductThumbnail } from "./ProductThumbnail.js";

interface Product {
    name: string;
    category: string;
    price: string;
    addedAgo: string;
    // Two gradient stops for the thumbnail, standing in for a product photo.
    colors: [string, string];
    badge?: "New" | "Low stock";
}

// Dummy data: this widget only demonstrates registering a dashboard widget from an extension.
const PRODUCTS: Product[] = [
    {
        name: "Trail Running Shoes",
        category: "Footwear",
        price: "$129.00",
        addedAgo: "5 min ago",
        colors: ["#ff9a6b", "#fa5923"],
        badge: "New"
    },
    {
        name: "Merino Wool Beanie",
        category: "Accessories",
        price: "$34.00",
        addedAgo: "22 min ago",
        colors: ["#9fb8ff", "#5a6fe6"],
        badge: "New"
    },
    {
        name: "Insulated Water Bottle",
        category: "Outdoor",
        price: "$28.50",
        addedAgo: "1 hour ago",
        colors: ["#7fe0c8", "#13a58a"]
    },
    {
        name: "Packable Rain Jacket",
        category: "Outerwear",
        price: "$149.00",
        addedAgo: "2 hours ago",
        colors: ["#ffd36b", "#f2a516"],
        badge: "Low stock"
    },
    {
        name: "Canvas Weekender Bag",
        category: "Bags",
        price: "$98.00",
        addedAgo: "3 hours ago",
        colors: ["#d6b4ff", "#8a4fe0"]
    },
    {
        name: "Ultralight Tent",
        category: "Outdoor",
        price: "$349.00",
        addedAgo: "yesterday",
        colors: ["#9be7ff", "#2a9bd8"]
    }
];

export const LatestProductsWidget = () => {
    return (
        <Widget
            variant={"light"}
            title={"Latest products"}
            description={"The newest additions to the catalog."}
            icon={<Widget.Icon icon={<ShoppingBagIcon />} label={"Latest products"} />}
            headerActions={<Widget.Action>View all</Widget.Action>}
            padding={"md"}
        >
            <List variant={"container"} className={"flex flex-col gap-y-xs"}>
                {PRODUCTS.map(product => {
                    let badge = null;
                    if (product.badge) {
                        const variant = product.badge === "New" ? "accent-light" : "neutral-muted";
                        badge = <Tag variant={variant} content={product.badge} />;
                    }
                    return (
                        <List.Item
                            key={product.name}
                            icon={<ProductThumbnail colors={product.colors} />}
                            title={
                                <span className={"flex items-center gap-sm"}>
                                    {product.name}
                                    {badge}
                                </span>
                            }
                            description={`${product.category} · ${product.addedAgo}`}
                            actions={
                                <Text size={"md"} className={"font-semibold"}>
                                    {product.price}
                                </Text>
                            }
                        />
                    );
                })}
            </List>
        </Widget>
    );
};
