import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app";
import { Routes } from "~/routes.js";
import { ReactComponent as WorkflowStatesListIcon } from "@webiny/icons/account_tree.svg";

const { Menu } = AdminConfig;

export const WorkflowsMenu = () => {
    const router = useRouter();

    return (
        <Menu
            name={"workflows.statesList"}
            pinnable={true}
            element={
                <Menu.Link
                    icon={<WorkflowStatesListIcon />}
                    text={"Publishing Workflows"}
                    to={router.getLink(Routes.Workflows.ContentReviews)}
                />
            }
        />
    );
};
