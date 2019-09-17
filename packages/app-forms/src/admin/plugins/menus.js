// @flow
import React from "react";
import { ReactComponent as PagesIcon } from "@webiny/app-forms/admin/icons/round-ballot-24px.svg";
import { hasRoles } from "@webiny/app-security";

export default [
    {
        name: "forms-menu",
        type: "menu",
        render({ Menu, Section, Item }: Object) {
            const { forms }: Object = (hasRoles({
                forms: ["form-editors"]
            }): any);

            if (forms) {
                return (
                    <Menu label={`Content`} icon={<PagesIcon />}>
                        <Section label={`Forms`}>{<Item label={`Forms`} path="/forms" />}</Section>
                    </Menu>
                );
            }

            return null;
        }
    }
];
