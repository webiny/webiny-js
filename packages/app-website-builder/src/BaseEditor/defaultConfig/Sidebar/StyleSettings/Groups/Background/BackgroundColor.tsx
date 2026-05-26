import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { ColorPicker } from "@webiny/admin-ui";

import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.js";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

export const BackgroundColor = observer(({ elementId }: { elementId: string }) => {
    const { styles, onChange, onPreviewChange, inheritanceMap } = useStyles(elementId);
    const [value, setValue] = useState(styles.backgroundColor ?? "transparent");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (styles.backgroundColor !== value) {
            setValue(styles.backgroundColor ?? "transparent");
        }
    }, [styles.backgroundColor]);

    const handleChange = (value: string) => {
        setValue(value);
        onPreviewChange(({ styles }) => {
            styles.set("backgroundColor", value);
        });

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onChange(({ styles }) => {
                styles.set("backgroundColor", value);
            });
        }, 300); // wait 300ms after last input event
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("backgroundColor");
        });
    };

    const inheritance = inheritanceMap?.backgroundColor ?? {};

    return (
        <SidebarRow
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Color"}
                />
            }
        >
            <ColorPicker value={value} onChange={handleChange} size={"md"} variant={"secondary"} />
        </SidebarRow>
    );
});
