import React, { useMemo } from "react";
import type { IconPickerIconDto, IconPickerProps } from "@webiny/admin-ui";
import { IconPicker as AdminIconPicker } from "@webiny/admin-ui";
import { plugins } from "@webiny/plugins";
import type { CmsIconsPlugin } from "~/types.js";

export const IconPicker = (props: Omit<IconPickerProps, "icons">) => {
    const icons: IconPickerIconDto[] = useMemo(() => {
        const iconPlugins = plugins.byType<CmsIconsPlugin>("cms-icons");
        return iconPlugins.reduce((icons: Array<IconPickerIconDto>, pl) => {
            return icons.concat(pl.getIcons());
        }, []);
    }, []);

    const onChange = (value: string | null) => {
        if (props.onChange) {
            if (!value) {
                props.onChange(null);
                return;
            }

            props.onChange({
                type: "icon",
                name: value
            });
        }
    };

    let value = null;
    if (props.value) {
        if (typeof props.value === "string") {
            value = props.value;
        } else {
            value = props.value.name;
        }
    }

    return (
        <AdminIconPicker size={"lg"} icons={icons} {...props} onChange={onChange} value={value} />
    );
};
