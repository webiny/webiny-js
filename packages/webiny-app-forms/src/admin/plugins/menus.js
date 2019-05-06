import React from "react";
import { ReactComponent as FormsIcon } from "./icons/round-list_alt-24px.svg";
import { hasRoles } from "webiny-app-security";

export default [
    {
        name: "cms-forms-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { forms } = hasRoles({ forms: ["cms-forms"] });

            if (forms) {
                return (
                    <Menu label={`Content`} icon={<FormsIcon />}>
                        <Menu label={`Forms`}>
                            {forms && <Menu label={`Forms`} route="Cms.Forms" />}
                        </Menu>
                    </Menu>
                );
            }

            return null;
        }
    }
];