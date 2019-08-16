// @flow
import React from "react";
import { ReactComponent as IconSvg } from "./round-star_border-24px.svg";
import IconSettings from "./IconSettings";
import styled from "react-emotion";
import Icon from "./Icon";
import { getSvg } from "./utils";
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
            name: "pb-page-element-icon",
            type: "pb-page-element",
            elementType: "icon",
            toolbar: {
                title: "Icon",
                group: "pb-page-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <IconSvg />
                        </PreviewBox>
                    );
                }
            },
            settings: [
                "pb-page-element-settings-icon",
                "",
                "pb-page-element-settings-padding",
                "pb-page-element-settings-margin",
                [
                    "pb-page-element-settings-horizontal-align",
                    { alignments: ["left", "center", "right"] }
                ],
                "",
                "pb-page-element-settings-clone",
                "pb-page-element-settings-delete",
                ""
            ],
            target: ["pb-page-element-column", "pb-page-element-row"],
            create(options: Object) {
                return {
                    type: "pb-page-element-icon",
                    elements: [],
                    data: {
                        icon: {
                            id: ["far", "star"],
                            svg: getSvg(["far", "star"]),
                            width: 50
                        },
                        settings: {
                            horizontalAlign: "center",
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
            name: "pb-page-element-settings-icon",
            type: "pb-page-element-settings",
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
