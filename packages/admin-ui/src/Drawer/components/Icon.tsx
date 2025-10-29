import * as React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import type { IconProps as IconComponentProps } from "~/Icon/index.js";
import { Icon as IconComponent } from "~/Icon/index.js";

type IconProps = IconComponentProps;

const IconBase = ({ className, ...props }: IconProps) => {
    return (
        <IconComponent
            size={"lg"}
            color={"neutral-strong"}
            {...props}
            className={cn("pt-xs", className)}
        />
    );
};

export const Icon = makeDecoratable("Icon", IconBase);
