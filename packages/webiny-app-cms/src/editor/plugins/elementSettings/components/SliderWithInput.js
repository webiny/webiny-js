// @flow
import * as React from "react";
import { connect } from "react-redux";
import { pure } from "recompose";
import { get } from "lodash";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { Icon } from "webiny-ui/Icon";
import { Slider } from "webiny-ui/Slider";
import { InputContainer } from "webiny-app-cms/editor/plugins/elementSettings/components/StyledComponents";
import { getActiveElement } from "webiny-app-cms/editor/selectors";

const SliderWithInput = pure(({ value, icon, placeholder, updateValue, updatePreview, className }: Object) => {
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
});

export default connect((state, { valueKey }: Object) => {
    return {
        value: get(getActiveElement(state), valueKey, 0)
    }
})(SliderWithInput);
