// @flow
import React from "react";
import { ReactComponent as IconSvg } from "./round-star_border-24px.svg";
import IconSettings from "./IconSettings";
import styled from "react-emotion";
import Icon from "./Icon";
import Action from "./../../elementSettings/components/Action";

export default () => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        color: "var(--mdc-theme-text-primary-on-background)",
        svg: {
            height: 50,
            width: 50
        }
    });

    return [
        {
            name: "cms-element-icon",
            type: "cms-element",
            toolbar: {
                title: "Icon",
                group: "cms-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <IconSvg />
                        </PreviewBox>
                    );
                }
            },
            settings: [
                "cms-element-settings-icon",
                "",
                "cms-element-settings-padding",
                "cms-element-settings-margin",
                "cms-element-settings-horizontal-align",
                "",
                "cms-element-settings-clone",
                "cms-element-settings-delete",
                ""
            ],
            target: ["cms-element-column", "cms-element-row"],
            create(options: Object) {
                return {
                    type: "cms-element-icon",
                    elements: [],
                    data: {},
                    settings: {
                        style: {
                            margin: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            },
                            padding: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            }
                        }
                    },
                    ...options
                };
            },
            render(props: Object) {
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
