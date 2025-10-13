import React from "react";
import type { LoaderProps } from "./Loader.js";
import { Loader } from "./Loader.js";
import { cn, makeDecoratable } from "~/utils.js";

type OverlayLoaderProps = LoaderProps;

const DecoratableOverlayLoader = ({ className, size = "lg", ...props }: OverlayLoaderProps) => {
    return (
        <div
            className={cn(
                "w-full h-full absolute inset-0 bg-neutral-base/80 flex items-center justify-center z-30",
                className
            )}
        >
            <Loader {...props} size={size} />
        </div>
    );
};

const OverlayLoader = makeDecoratable("OverlayLoader", DecoratableOverlayLoader);

export { OverlayLoader, type OverlayLoaderProps };
