import React from "react";
import { AddMenu as Menu } from "@webiny/app-admin";
import { ReactComponent as ApwIcon } from "~/assets/icons/account_tree_24dp.svg";

const Menus = () => {
    return (
        <Menu label={"Publishing Workflows"} name={"apw"} icon={<ApwIcon />}>
            <Menu
                name={"apw.contentReviews"}
                label={"Content reviews"}
                path={"/apw/content-reviews"}
            />
            <Menu
                name={"apw.publishingWorkflows"}
                label={"Workflows"}
                path={"/apw/publishing-workflows"}
            />
        </Menu>
    );
};

export default Menus;
