import React from "react";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import lodashGet from "lodash/get";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Icon } from "@webiny/ui/Icon";
import { Slider } from "@webiny/ui/Slider";
import { InputContainer } from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { useRecoilValue } from "recoil";

type SliderWithInputPropsType = {
    icon: React.ReactElement;
    valueKey: string;
    placeholder?: string;
    updateValue: (value: any) => void;
    updatePreview: (value: any) => void;
    className?: string;
    // TODO check - not used anywhere
    label?: string;
};
const SliderWithInput: React.FunctionComponent<SliderWithInputPropsType> = ({
    icon,
    placeholder,
    updateValue,
    updatePreview,
    className,
    valueKey
}) => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const value = lodashGet(element, valueKey, 0);
    return (
        <Grid className={className}>
            <Cell span={2}>
                <Icon icon={icon} />
            </Cell>
            <Cell span={6}>
                <Slider
                    value={value}
                    onChange={updateValue}
                    onInput={updatePreview}
                    min={0}
                    max={100}
                    step={1}
                />
            </Cell>
            <Cell span={4}>
                <InputContainer>
                    <Input placeholder={placeholder || "px"} value={value} onChange={updateValue} />
                </InputContainer>
            </Cell>
        </Grid>
    );
};

export default React.memo(SliderWithInput);
