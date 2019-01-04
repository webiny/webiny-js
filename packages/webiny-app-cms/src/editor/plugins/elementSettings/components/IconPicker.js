// @flow
import * as React from "react";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { isEqual } from "lodash";
import IconPickerComponent from "webiny-app-cms/editor/components/IconPicker";

type Props = {
    label: string,
    value: string,
    updateValue: Function
};

class IconPicker extends React.Component<Props> {
    shouldComponentUpdate(props: Object) {
        return !isEqual(props, this.props);
    }

    render() {
        const { label, value, updateValue } = this.props;
        return (
            <Grid>
                <Cell span={4}>
                    <Typography use={"overline"}>{label}</Typography>
                </Cell>
                <Cell span={8}>
                    <IconPickerComponent label={label} value={value} onChange={updateValue} />
                </Cell>
            </Grid>
        );
    }
}

export default IconPicker;
