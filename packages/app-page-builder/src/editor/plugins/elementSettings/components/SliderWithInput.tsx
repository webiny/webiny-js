import React from "react";
import { elementWithChildrenByIdSelector, activeElementAtom } from "../../../recoil/modules";
import lodashGet from "lodash/get";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Icon } from "@webiny/ui/Icon";
import { Slider } from "@webiny/ui/Slider";
import { useRecoilValue } from "recoil";
import InputField from "./InputField";

interface SliderWithInputPropsType {
    icon: React.ReactElement;
    valueKey: string;
    placeholder?: string;
    updateValue: (value: any) => void;
    updatePreview: (value: any) => void;
    className?: string;
    // TODO check - not used anywhere
    label?: string;
    step?: number;
    max?: number;
}
const SliderWithInput = ({
    icon,
    placeholder,
    updateValue,
    updatePreview,
    className,
    valueKey,
    max = 100,
    step = 1
}: SliderWithInputPropsType) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const value = lodashGet(element, valueKey, 0);
    return (
        <Grid className={className}>
            <Cell align={"middle"} span={2}>
                <Icon icon={icon} />
            </Cell>
            <Cell align={"middle"} span={6}>
                <Slider
                    value={value}
                    onChange={updateValue}
                    onInput={updatePreview}
                    min={0}
                    max={max}
                    step={step}
                />
            </Cell>
            <Cell align={"middle"} span={4}>
                <InputField
                    placeholder={placeholder || "ms"}
                    value={value}
                    onChange={updateValue}
                />
            </Cell>
        </Grid>
    );
};

export default React.memo(SliderWithInput);
