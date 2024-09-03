import React from "react";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { makeDecoratable } from "@webiny/react-composition";

interface IconProps extends React.HTMLAttributes<HTMLOrSVGElement> {
    label: string;
    icon: React.ReactElement;
}

const IconBase = React.forwardRef<HTMLOrSVGElement, IconProps>((props, ref) => {
    const { label, icon, ...rest } = props;
    return (
        <AccessibleIcon.Root label={label}>
            {React.cloneElement(icon, { ...rest, ref })}
        </AccessibleIcon.Root>
    );
});

IconBase.displayName = "Icon";

const Icon = makeDecoratable("Icon", IconBase);

export { Icon, type IconProps };
