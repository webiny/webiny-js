// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { ReactComponent as IconSvg } from "./round-flag-24px.svg";
import IconSettings from "./IconSettings";
import Icon from "./Icon";
import Action from "./../../elementSettings/Action";

export default (): ElementPluginType => {
    return [
        {
            name: "cms-element-icon",
            type: "cms-element",
            toolbar: {
                title: "Icon",
                group: "cms-element-group-image",
                preview() {
                    // TODO: @sven
                    return "Icon preview";
                }
            },
            settings: [
                "cms-element-settings-icon",
                "",
                "cms-element-settings-padding",
                "cms-element-settings-margin",
                "",
                "cms-element-settings-clone",
                "cms-element-settings-delete",
                ""
            ],
            target: ["cms-element-column", "cms-element-row"],
            create(options) {
                return {
                    type: "cms-element-icon",
                    elements: [],
                    data: {},
                    ...options
                };
            },
            render(props) {
                return <Icon {...props} />;
            }
        },
        {
            name: "cms-element-settings-icon",
            type: "cms-element-settings",
            renderAction({ active }: { active: boolean }) {
                return (
                    <Action
                        plugin={this.name}
                        tooltip={"Icon"}
                        active={active}
                        icon={<IconSvg />}
                    />
                );
            },
            renderMenu() {
                return <IconSettings />;
            }
        }
    ];
};
