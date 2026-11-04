import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import type { IconProps as IconComponentProps } from "~/Icon/index.js";
import { Icon as IconComponent } from "~/Icon/index.js";

type IconProps = IconComponentProps;

const IconBase = (props: IconProps) => {
    return <IconComponent size={"lg"} color={"neutral-strong"} {...props} />;
};

export const Icon = makeDecoratable("Icon", IconBase);
