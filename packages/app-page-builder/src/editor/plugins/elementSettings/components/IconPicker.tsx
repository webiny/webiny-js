import * as React from "react";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { isEqual } from "lodash";
import IconPickerComponent from "@webiny/app-page-builder/editor/components/IconPicker";

type Props = {
    label: string;
    value: string;
    updateValue: (value: any) => void;
    removable?: boolean;
};

class IconPicker extends React.Component<Props> {
    shouldComponentUpdate(props) {
        return !isEqual(props, this.props);
    }

    render() {
        const { label, value, updateValue, removable } = this.props;
        return (
            <Grid>
                <Cell span={4}>
                    <Typography use={"overline"}>{label}</Typography>
                </Cell>
                <Cell span={8}>
                    <IconPickerComponent
                        value={value}
                        onChange={updateValue}
                        removable={removable}
                    />
                </Cell>
            </Grid>
        );
    }
}

export default IconPicker;
