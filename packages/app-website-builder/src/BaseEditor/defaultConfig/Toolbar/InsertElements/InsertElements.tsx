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
        <div className="flex flex-row items-center p-sm bg-neutral-light rounded-sm gap-sm cursor-grab">
            <Icon
                label="Icon"
                icon={<InlineSvg src={component.image!} className={"fill-neutral-strong"} />}
                size={"md"}
                className={"fill-neutral-strong"}
            />
            <div className="text-sm font-medium text-neutral-primary text-center">
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
                        // padding={""}
                    >
                        <div className="flex flex-col gap-sm p-sm justify-start">
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
