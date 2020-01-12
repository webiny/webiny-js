import * as React from "react";
import { Typography } from "@webiny/ui/Typography";
import { Cell } from "@webiny/ui/Grid";
import { isEqual } from "lodash";
import IconPickerComponent from "@webiny/app-page-builder/editor/components/IconPicker";

type IconPickerProps = {
    label: string;
    value: string;
    updateValue: Function;
};

class IconPicker extends React.Component<IconPickerProps> {
    shouldComponentUpdate(props: IconPickerProps) {
        return !isEqual(props, this.props);
    }

    render() {
        const { label, value, updateValue } = this.props;
        return (
            <React.Fragment>
                <Cell span={4}>
                    <Typography use={"overline"}>{label}</Typography>
                </Cell>
                <Cell span={8}>
                    <IconPickerComponent value={value} onChange={updateValue} />
                </Cell>
            </React.Fragment>
        );
    }
}

export default IconPicker;
