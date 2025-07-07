import React from "react";
import { Tabs, Icon, Card } from "@webiny/admin-ui";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor";
import type { ComponentGroupItem, ComponentManifest } from "~/sdk/types";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg";
import { ReactComponent as InsertIcon } from "@webiny/icons/add_circle_outline.svg";
import { Draggable } from "~/BaseEditor/components/Draggable";
import { useComponentGroups } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/useComponentGroups";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer";

export const InsertElements = () => {
    return (
        <Tabs.Tab
            value="insert"
            trigger={"Components"}
            spacing={"sm"}
            icon={<Icon icon={<InsertIcon />} label={"Insert Element"} />}
            content={
                <ScrollableContainer>
                    <ElementPalette />
                </ScrollableContainer>
            }
        />
    );
};

const defaultImage = "https://material-icons.github.io/material-icons/svg/extension/outline.svg";

const GroupComponent = ({ item }: { item: ComponentGroupItem }) => {
    const components = useSelectFromEditor<Record<string, ComponentManifest>>(state => {
        return state.components ?? {};
    });

    const component = components[item.name];

    if (!component) {
        return <></>;
    }

    return (
        <div className="wby-flex wby-flex-row wby-items-center wby-p-sm wby-bg-neutral-light wby-rounded-sm wby-gap-sm wby-cursor-grab">
            <Icon
                label="Icon"
                icon={<InlineSvg src={component.image ?? defaultImage} />}
                size={"md"}
                className={"wby-fill-neutral-strong"}
            />
            <div className="wby-mt-1 wby-text-sm wby-font-medium wby-text-neutral-primary wby-text-center">
                {component.label ?? component.name}
            </div>
        </div>
    );
};

const ElementPalette = () => {
    const groups = useComponentGroups();

    return (
        <>
            {groups.map(group => {
                if (!group.items.length) {
                    return null;
                }

                return (
                    <Card
                        key={group.name}
                        title={group.label}
                        description={group.description}
                        borderRadius={"none"}
                        padding={"compact"}
                    >
                        <div className="wby-flex wby-flex-col wby-gap-sm wby-p-sm wby-justify-start">
                            {group.items.map(item => {
                                return (
                                    <Draggable
                                        key={item.name}
                                        type="ELEMENT"
                                        item={{ componentName: item.name }}
                                    >
                                        {({ dragRef }) => (
                                            <div ref={dragRef}>
                                                <GroupComponent item={item} />
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                        </div>
                    </Card>
                );
            })}
        </>
    );
};
