// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "webiny-app-cms/admin/assets/round-ballot-24px.svg";
import { hasRoles } from "webiny-app-security";

export default [
    {
        name: "forms-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { forms }: Object = (hasRoles({
                forms: ["form-editors"]
            }): any);

            if (forms) {
                return (
                    <Menu label={`Content`} icon={<PagesIcon />}>
                        <Menu label={`Forms`}>{<Menu label={`Forms`} path="/forms" />}</Menu>
                    </Menu>
                );
            }

            return null;
        }
    }
];
