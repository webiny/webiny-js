import React from "react";
import { Sidebar } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";

export interface ReviewContentReviewsSidebarItemProps {
    route: Route<any>;
    icon: React.ReactElement;
    className?: string;
}

// The "Content Reviews" item of an app's list sidebar. The app mounts it and gives the route and icon.
export const ReviewContentReviewsSidebarItem = ({
    route,
    icon,
    className
}: ReviewContentReviewsSidebarItemProps) => {
    const { goToRoute } = useRouter();

    return (
        <Sidebar.Item
            className={className}
            onClick={() => goToRoute(route)}
            text={"Content Reviews"}
            icon={<Sidebar.Item.Icon element={icon} label={"Content Reviews"} />}
        />
    );
};
