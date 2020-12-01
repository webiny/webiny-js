import React from "react";
import { get } from "lodash";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";

import { COLORS } from "./StyledComponents";

const selectStyle = css({
    display: "block",
    color: COLORS.darkestGray,
    padding: ".6em 1.4em .5em .8em",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0",
    border: `1px solid ${COLORS.gray}`,
    borderRadius: 1,
    MozAppearance: "none",
    WebkitAppearance: "none",
    appearance: "none",
    backgroundColor: COLORS.lightGray,
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
    backgroundRepeat: "no-repeat, repeat",
    backgroundPosition: "right .7em top 50%, 0 0",
    backgroundSize: "24px auto, 100%",

    "&::-ms-expand": { display: "none" },
    "&:hover": { borderColor: COLORS.darkGray },
    "&:focus": {
        borderColor: COLORS.darkGray,
        outline: "none"
    },
    "& option": { fontWeight: "normal" }
});

type SelectProps = {
    label: string;
    value?: string;
    valueKey?: string;
    defaultValue?: string;
    updateValue: (value: any) => void;
    options?: Array<string>;
    disabled?: boolean;
    // One or more <option> or <optgroup> elements.
    children?: Array<React.ReactElement<"option"> | React.ReactElement<"optgroup">>;
    className?: string;
};

const SelectBox = ({
    label,
    value,
    valueKey,
    defaultValue,
    updateValue,
    children,
    className
}: SelectProps) => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const keyValue = valueKey ? get(element, valueKey, defaultValue) : value;
    return (
        <Grid className={className}>
            <Cell span={4}>
                <Typography use={"subtitle2"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <select
                    className={selectStyle}
                    value={keyValue}
                    onChange={({ target: { value } }) => {
                        updateValue(value);
                    }}
                >
                    {children}
                </select>
            </Cell>
        </Grid>
    );
};

export default React.memo(SelectBox);
