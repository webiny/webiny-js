import React from "react";
import { css } from "emotion";
import groupBy from "lodash/groupBy";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox } from "@webiny/ui/Checkbox";
import { GetValueCallable, OnChangeCallable, PermissionSelectorCmsGroup } from "./types";

const groupStyles = css({
    marginLeft: 20
});

const labelStyles = css({
    display: "block",
    color: "var(--mdc-theme-text-secondary-on-light)",
    fontWeight: "bold"
});

interface GroupItem extends PermissionSelectorCmsGroup {
    groupName: string;
}

interface ContentModelListProps {
    items: PermissionSelectorCmsGroup[];
    onChange: OnChangeCallable;
    getValue: GetValueCallable;
}
const ContentModelList = ({ items, onChange, getValue }: ContentModelListProps) => {
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
        <React.Fragment>
            {list.map(([key, value]) => {
                return (
                    <div key={key} className={groupStyles}>
                        <Typography use={"caption"} className={labelStyles}>
                            {key}
                        </Typography>
                        {value.map(({ id, label }) => (
                            <div key={id}>
                                <Checkbox
                                    key={id}
                                    label={label}
                                    value={getValue(id)}
                                    onChange={onChange(id)}
                                />
                            </div>
                        ))}
                    </div>
                );
            })}
        </React.Fragment>
    );
};

export default ContentModelList;
