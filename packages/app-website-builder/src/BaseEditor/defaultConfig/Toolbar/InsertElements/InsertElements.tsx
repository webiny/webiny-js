import React from "react";
import { Icon, Card } from "@webiny/admin-ui";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import type { ComponentGroupItem, ComponentManifest } from "@webiny/website-builder-sdk";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";
import { Draggable } from "~/BaseEditor/components/Draggable.js";
import { useComponentGroups } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/useComponentGroups.js";

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
                icon={<InlineSvg src={component.image!} className={"wby-fill-neutral-strong"} />}
                size={"md"}
                className={"wby-fill-neutral-strong"}
            />
            <div className="wby-text-sm wby-font-medium wby-text-neutral-primary wby-text-center">
                {component.label ?? component.name}
            </div>
        </div>
    );
};

export const InsertElements = () => {
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
                        // borderRadius={"none"}
                        // padding={"compact"}
                    >
                        <div className="wby-flex wby-flex-col wby-gap-sm wby-p-sm wby-justify-start">
                            {group.items.map(item => {
                                return (
                                    <Draggable
                                        key={item.name}
                                        type="ELEMENT"
                                        item={{ componentName: item.name }}
                                    >
                                        {({ dragRef }) =>
                                            dragRef(
                                                <div>
                                                    <GroupComponent item={item} />
                                                </div>
                                            )
                                        }
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
