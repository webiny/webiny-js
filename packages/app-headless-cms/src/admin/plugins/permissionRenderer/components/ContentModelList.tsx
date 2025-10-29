import React from "react";
import groupBy from "lodash/groupBy.js";
import get from "lodash/get.js";
import type { PermissionSelectorCmsGroup } from "./types.js";
import { CheckboxGroup, Text } from "@webiny/admin-ui";

interface GroupItem extends PermissionSelectorCmsGroup {
    groupName: string;
}

interface ContentModelListProps {
    items: PermissionSelectorCmsGroup[];
    label: string;
    disabled?: boolean;
    value?: string[];
    onChange?: (values: string[]) => void;
}
const ContentModelList = ({ items, label, disabled, value, onChange }: ContentModelListProps) => {
    const list: [string, GroupItem[]][] = Object.entries(
        groupBy(
            items.map((item): GroupItem => {
                return {
                    ...item,
                    groupName: get(item, "group.label")
                };
            }),
            "groupName"
        )
    );

    return (
        <>
            <Text className={"font-semibold"}>{label}</Text>
            {list.map(([key, items]) => {
                return (
                    <div key={key} className={"ml-md mt-sm"}>
                        <CheckboxGroup
                            label={key}
                            value={value}
                            onChange={onChange}
                            items={items.map(item => {
                                return {
                                    value: item.id,
                                    label: item.label,
                                    disabled
                                };
                            })}
                        />
                    </div>
                );
            })}
        </>
    );
};

export default ContentModelList;
