import React from "react";
import { AddMenu as Menu } from "@webiny/app-admin";

const Menus = () => {
    return (
        <Menu name={"settings"}>
            <Menu name={"apw"} label={"Apw"}>
                <Menu
                    name={"apw.contentReviews"}
                    label={"Content reviews"}
                    path={"/apw/content-reviews"}
                />
                <Menu
                    name={"apw.publishingWorkflows"}
                    label={"Publishing workflows"}
                    path={"/apw/publishing-workflows"}
                />
            </Menu>
        </Menu>
    );
};

export default Menus;
