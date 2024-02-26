import React from "react";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Checkbox as CheckboxCmp } from "@webiny/ui/Checkbox";
import { ReactElement } from "react";
import { useRecoilValue } from "recoil";

interface CheckboxProps {
    label: string;
    value: string;
    valueKey: string;
    updateValue: (value: any) => void;
    // One or more <option> or <optgroup> elements.
    children?: Array<ReactElement<"option"> | ReactElement<"optgroup">>;
}

const Checkbox = ({
    label,
    valueKey,
    value: defaultValue,
    updateValue,
    children
}: CheckboxProps) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));
    const value = valueKey ? get(element, valueKey, defaultValue) : defaultValue;
    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <CheckboxCmp value={value} onChange={updateValue}>
                    {children}
                </CheckboxCmp>
            </Cell>
        </Grid>
    );
};

export default React.memo(Checkbox);
