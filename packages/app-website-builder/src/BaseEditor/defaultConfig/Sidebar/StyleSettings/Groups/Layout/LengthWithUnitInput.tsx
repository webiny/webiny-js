import React from "react";
import { observer } from "mobx-react-lite";
import { InheritanceLabel } from "../../../InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";
import { useStyleValue } from "../../useStyleValue.js";
import { UnitValuePicker, type UnitOption } from "../../UnitValuePicker.js";

interface LengthWithUnitInputProps {
    elementId: string;
    label: string;
    propertyName: string;
    unitOptions: UnitOption[];
    defaultValue?: string;
}

export const LengthWithUnitInput = observer(
    ({ elementId, label, propertyName, defaultValue, unitOptions }: LengthWithUnitInputProps) => {
        const style = useStyleValue(elementId, propertyName, defaultValue);

        return (
            <SidebarRow
                label={
                    <InheritanceLabel
                        text={label}
                        onReset={style.onReset}
                        isOverridden={style.overridden}
                        inheritedFrom={style.inheritedFrom}
                    />
                }
            >
                <UnitValuePicker
                    value={style.value}
                    unit={style.unit}
                    units={unitOptions}
                    onChange={style.onChange}
                    onChangePreview={style.onChangePreview}
                />
            </SidebarRow>
        );
    }
);
