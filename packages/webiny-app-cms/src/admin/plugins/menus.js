// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "webiny-app-cms/admin/assets/round-ballot-24px.svg";
import { hasRoles } from "webiny-app-security";

export default [
    {
        name: "cms-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { menus, categories, editor }: Object = (hasRoles({
                menus: ["cms-menus"],
                categories: ["cms-categories"],
                editor: ["cms-editor"]
            }): any);

            if (menus || categories || editor) {
                return (
                    <Menu label={`Content`} icon={<PagesIcon />}>
                        <Menu label={`Pages`}>
                            {categories && <Menu label={`Categories`} route="Cms.Categories" />}
                            {editor && <Menu label={`Pages`} route="Cms.Pages" />}
                            {menus && <Menu label={`Menus`} route="Cms.Menus" />}
                        </Menu>
                    </Menu>
                );
            }

            return null;
        }
    }
];
