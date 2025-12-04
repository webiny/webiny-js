import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app";
import { Routes } from "~/routes.js";
import { ReactComponent as ContentReviewsListIcon } from "@webiny/icons/account_tree.svg";

const { Menu } = AdminConfig;

export const WorkflowsMenu = () => {
    const router = useRouter();

    return (
        <Menu
            name={"workflows.contentReviews"}
            pinnable={true}
            element={
                <Menu.Link
                    icon={
                        <Menu.Link.Icon
                            label="Content Reviews"
                            element={<ContentReviewsListIcon />}
                        />
                    }
                    text={"Content Reviews"}
                    to={router.getLink(Routes.Workflows.ContentReviews)}
                />
            }
        />
    );
};
