import React from "react";
import { AddMenu as Menu } from "@webiny/app-admin";

const Menus = () => {
    return (
        <Menu name={"apw"} label={"Apw"}>
            <Menu
                name={"apw.publishingWorkflows"}
                label={"Publishing workflows"}
                path={"/apw/publishing-workflows"}
            />
        </Menu>
    );
};

export default Menus;


