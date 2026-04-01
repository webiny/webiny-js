import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { ColorPicker } from "@webiny/admin-ui";
import { useStyles } from "../../useStyles.js";

interface BorderColorProps {
    elementId: string;
}

export const BorderColor = observer(({ elementId }: BorderColorProps) => {
    const { styles, onChange, onPreviewChange } = useStyles(elementId);
    const [value, setValue] = useState(styles.borderColor ?? "transparent");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (styles.borderColor !== value) {
            setValue(styles.borderColor ?? "transparent");
        }
    }, [styles.borderColor]);

    const handleChange = (value: string) => {
        setValue(value);
        onPreviewChange(({ styles }) => {
            styles.set("borderColor", value);
        });

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onChange(({ styles }) => {
                styles.set("borderColor", value);
            });
        }, 300);
    };

    return (
        <ColorPicker
            label={"Border color"}
            description={"Select border color"}
            value={value}
            onChange={handleChange}
        />
    );
});
