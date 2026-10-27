import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";

export interface ReviewContentReviewsMenuProps {
    name: string;
    route: Route<any>;
    parent?: string;
}

// The "Content Reviews" menu item of one app; `parent` nests it under that app's menu group.
export const ReviewContentReviewsMenu = ({
    name,
    route,
    parent
}: ReviewContentReviewsMenuProps) => {
    const router = useRouter();
    const { Menu } = AdminConfig;

    return (
        <AdminConfig>
            <Menu
                name={name}
                parent={parent ?? null}
                pinnable={true}
                element={
                    <Menu.Link text="Content Reviews" to={router.getLink(route)} pinnable={true} />
                }
            />
        </AdminConfig>
    );
};
