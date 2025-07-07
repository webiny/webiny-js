import React, { useEffect, useRef, useState } from "react";
import { ColorPicker } from "@webiny/admin-ui";

import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel";

export const BackgroundColor = ({ elementId }: { elementId: string }) => {
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
        <ColorPicker
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Color"}
                />
            }
            description="Select your background color"
            value={value}
            onChange={handleChange}
        />
    );
};
