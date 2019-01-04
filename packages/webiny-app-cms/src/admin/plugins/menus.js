// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "webiny-app-cms/admin/assets/round-ballot-24px.svg";
import { hasScopes } from "webiny-app-security";
import { SCOPES_MENUS, SCOPES_CATEGORIES, SCOPES_PAGES } from "webiny-app-cms";

export default [
    {
        name: "cms-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { menus, categories, pages }: Object = (hasScopes({
                menus: SCOPES_MENUS,
                categories: SCOPES_CATEGORIES,
                pages: SCOPES_PAGES
            }): any);

            if (menus || categories || pages) {
                return (
                    <Menu label={`Content`} icon={<PagesIcon />}>
                        <Menu label={`Pages`}>
                            {categories && <Menu label={`Categories`} route="Cms.Categories" />}
                            {pages && <Menu label={`Pages`} route="Cms.Pages" />}
                            {menus && <Menu label={`Menus`} route="Cms.Menus" />}
                        </Menu>
                    </Menu>
                );
            }

            return null;
        }
    }
];
