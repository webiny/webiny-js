import React from "react";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select as SelectCmp } from "@webiny/ui/Select";
import { css } from "emotion";
import { useRecoilValue } from "recoil";

const selectStyle = css({
    select: {
        height: 35,
        paddingTop: "4px !important"
    }
});

interface SelectProps {
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
}

const Select = ({
    label,
    value,
    valueKey,
    defaultValue,
    updateValue,
    options,
    children,
    className
}: SelectProps) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const keyValue = valueKey ? get(element, valueKey, defaultValue) : value;
    return (
        <Grid className={className}>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <SelectCmp
                    className={selectStyle}
                    value={keyValue}
                    onChange={updateValue}
                    options={options}
                >
                    {children}
                </SelectCmp>
            </Cell>
        </Grid>
    );
};

export default React.memo(Select);
