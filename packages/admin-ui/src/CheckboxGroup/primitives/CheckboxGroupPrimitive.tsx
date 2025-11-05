import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import type { CheckboxItemDto, CheckboxItemFormatted } from "~/Checkbox/index.js";
import { CheckboxPrimitiveRenderer } from "~/Checkbox/index.js";
import { useCheckboxGroup } from "./useCheckboxGroup.js";

interface CheckboxGroupPrimitiveProps<TValue = any> {
    /**
     * Array of checkbox items.
     */
    items: CheckboxItemDto[];
    /**
     * Callback function called when the checkbox values change.
     */
    onChange?: (values: TValue[]) => void;
    /**
     * Array of selected checkbox values.
     */
    value?: TValue[];
}

interface CheckboxGroupPrimitiveVm {
    items: CheckboxItemFormatted[];
}

type CheckboxGroupPrimitiveRendererProps<TValue = any> = CheckboxGroupPrimitiveVm & {
    changeChecked: (value: TValue) => void;
};

/**
 * Checkbox Group Renderer
 */
const DecoratableCheckboxGroupPrimitiveRenderer = ({
    items,
    changeChecked
}: CheckboxGroupPrimitiveRendererProps) => {
    return (
        <div className={cn("grid gap-sm-extra py-xs-plus")}>
            {items.map(item => (
                <CheckboxPrimitiveRenderer
                    key={item.id}
                    {...item}
                    changeChecked={() => changeChecked(item.value)}
                />
            ))}
        </div>
    );
};
const CheckboxGroupPrimitiveRenderer = makeDecoratable(
    "CheckboxGroupPrimitiveRenderer",
    DecoratableCheckboxGroupPrimitiveRenderer
);

/**
 * Checkbox Group
 */
const DecoratableCheckboxGroupPrimitive = (props: CheckboxGroupPrimitiveProps) => {
    const { vm, changeChecked } = useCheckboxGroup(props);
    return <CheckboxGroupPrimitiveRenderer {...vm} changeChecked={changeChecked} />;
};
const CheckboxGroupPrimitive = makeDecoratable(
    "CheckboxGroupPrimitive",
    DecoratableCheckboxGroupPrimitive
);

export {
    CheckboxGroupPrimitive,
    CheckboxGroupPrimitiveRenderer,
    type CheckboxGroupPrimitiveProps,
    type CheckboxGroupPrimitiveRendererProps,
    type CheckboxGroupPrimitiveVm
};
