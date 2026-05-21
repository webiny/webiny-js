import React from "react";
import groupBy from "lodash/groupBy.js";
import type { PermissionSelectorCmsGroup } from "./types.js";
import { CheckboxGroup } from "@webiny/admin-ui";

interface GroupItem extends PermissionSelectorCmsGroup {
    groupName: string;
}

interface ContentModelListProps {
    items: PermissionSelectorCmsGroup[];
    disabled?: boolean;
    value?: string[];
    onChange?: (values: string[]) => void;
}
const ContentModelList = ({ items, disabled, value, onChange }: ContentModelListProps) => {
    const list: [string, GroupItem[]][] = Object.entries(
        groupBy(
            items.map((item): GroupItem => {
                return {
                    ...item,
                    groupName: item.group.label
                };
            }),
            "groupName"
        )
    );

    return (
        <>
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
