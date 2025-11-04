import * as React from "react";
import { Select as SelectPrimitives } from "radix-ui";

type SelectIconProps = {
    icon: React.ReactElement;
};

const SelectIcon = ({ icon }: SelectIconProps) => {
    return (
        <SelectPrimitives.Icon asChild className={"h-md w-md"}>
            {React.cloneElement(icon)}
        </SelectPrimitives.Icon>
    );
};

export { SelectIcon, type SelectIconProps };
