import React from "react";
import { css } from "emotion";
import groupBy from "lodash/groupBy";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox } from "@webiny/ui/Checkbox";

const groupStyles = css({
    marginLeft: 20
});

const labelStyles = css({
    display: "block",
    color: "var(--mdc-theme-text-secondary-on-light)",
    fontWeight: "bold"
});

const ContentModelList = ({ items, onChange, getValue }) => {
    const list = Object.entries(
        groupBy(
            items.map(i => ({
                ...i,
                groupName: get(i, "group.label")
            })),
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
                        {(value as any[]).map(({ id, label }) => (
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
