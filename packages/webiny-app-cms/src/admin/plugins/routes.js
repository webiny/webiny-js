// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "webiny-app-cms/admin/assets/round-ballot-24px.svg";

export default [
    {
        name: "cms-menu",
        type: "menu",
        render({ Menu }: Object) {
            return (
                <Menu label={`Content`} icon={<PagesIcon />}>
                    <Menu label={`Pages`}>
                        <Menu label={`Categories`} route="Cms.Categories" />
                        <Menu label={`Pages`} route="Cms.Pages" />
                        <Menu label={`Menus`} route="Cms.Menus" />
                    </Menu>
                </Menu>
            );
        }
    }
];
