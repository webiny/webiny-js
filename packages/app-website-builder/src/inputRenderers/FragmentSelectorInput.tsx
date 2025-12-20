import React, { useMemo } from "react";
import { Select } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { toTitleCaseLabel } from "~/shared/toTitleCaseLabel.js";

type Fragment =
    | { type: "fixed"; name: string }
    | { type: "component"; component: string; inputs: Record<string, any> };

export const FragmentSelectorInputRenderer = ({
    value,
    onChange,
    label,
    input
}: ElementInputRendererProps) => {
    const fragments = useSelectFromEditor<Fragment[]>(state => state.fragments ?? []);

    const options = useMemo(() => {
        return fragments
            .filter(fragment => fragment.type === "fixed")
            .sort()
            .map(fragment => ({
                label: toTitleCaseLabel(fragment.name),
                value: fragment.name
            }));
    }, [fragments]);

    return (
        <Select
            value={value}
            onChange={newValue => {
                onChange(({ value }) => {
                    value.set(newValue);
                });
            }}
            displayResetAction={true}
            options={options}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
