// @flow
import * as React from "react";
import { pure } from "recompose";
import { Input } from "webiny-ui/Input";
import { Cell } from "webiny-ui/Grid";
import { Icon } from "webiny-ui/Icon";
import { Slider } from "webiny-ui/Slider";
import { InputContainer } from "webiny-app-cms/editor/plugins/elementSettings/components/StyledComponents";

const PMPropertyInput = pure(({ value, icon, updateValue, updatePreview }: Object) => {
    return (
        <React.Fragment>
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
                    <Input placeholder={"px"} value={value} onChange={updateValue} />
                </InputContainer>
            </Cell>
        </React.Fragment>
    );
});

export default PMPropertyInput;
