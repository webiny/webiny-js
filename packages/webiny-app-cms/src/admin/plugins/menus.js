// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "webiny-app-cms/admin/assets/round-ballot-24px.svg";
import { hasRoles } from "webiny-app-security";

export default [
    {
        name: "pb-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { menus, categories, editor }: Object = (hasRoles({
                menus: ["pb-menus"],
                categories: ["pb-categories"],
                editor: ["pb-editor"]
            }): any);

            if (menus || categories || editor) {
                return (
                    <Menu label={`Content`} icon={<PagesIcon />}>
                        <Menu label={`Pages`}>
                            {categories && <Menu label={`Categories`} path="/page-builder/categories" />}
                            {editor && <Menu label={`Pages`} path="/page-builder/pages" />}
                            {menus && <Menu label={`Menus`} path="/page-builder/menus" />}
                        </Menu>
                    </Menu>
                );
            }

            return null;
        }
    }
];
