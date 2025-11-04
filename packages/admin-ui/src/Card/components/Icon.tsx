import * as React from "react";
import type { IconProps as IconComponentProps } from "~/Icon/index.js";
import { Icon as IconComponent } from "~/Icon/index.js";
import { makeDecoratable } from "~/utils.js";

type IconProps = IconComponentProps;

const IconBase = (props: IconProps) => {
    return <IconComponent size={"md"} color={"neutral-strong"} {...props} />;
};

export const Icon = makeDecoratable("Icon", IconBase);
