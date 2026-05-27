import React, { useRef, useState, useEffect } from "react";
import { cn, makeDecoratable } from "~/utils.js";

interface FillViewportStyle {
    width?: number;
    height?: number;
}

function useFillViewportStyle(axis: "width" | "height" | "both") {
    const ref = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<FillViewportStyle>();

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const measure = () => {
            const rect = el.getBoundingClientRect();
            const next: FillViewportStyle = {};

            if (axis === "width" || axis === "both") {
                next.width = window.innerWidth - rect.left;
            }

            if (axis === "height" || axis === "both") {
                next.height = window.innerHeight - rect.top;
            }

            setStyle(next);
        };

        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(document.documentElement);

        return () => ro.disconnect();
    }, []);

    return { ref, style };
}

type FillViewportProps = React.HTMLAttributes<HTMLDivElement>;

const BaseFillViewportHeight = ({ className, children, ...props }: FillViewportProps) => {
    const { ref, style } = useFillViewportStyle("height");

    return (
        <div
            ref={ref}
            className={cn(className)}
            style={style !== undefined ? { height: style.height, ...props.style } : props.style}
            {...props}
        >
            {children}
        </div>
    );
};

const BaseFillViewportWidth = ({ className, children, ...props }: FillViewportProps) => {
    const { ref, style } = useFillViewportStyle("width");

    return (
        <div
            ref={ref}
            className={cn(className)}
            style={style !== undefined ? { width: style.width, ...props.style } : props.style}
            {...props}
        >
            {children}
        </div>
    );
};

const BaseFillViewport = ({ className, children, ...props }: FillViewportProps) => {
    const { ref, style } = useFillViewportStyle("both");

    return (
        <div
            ref={ref}
            className={cn(className)}
            style={style !== undefined ? { ...style, ...props.style } : props.style}
            {...props}
        >
            {children}
        </div>
    );
};

const FillViewportHeight = makeDecoratable("FillViewportHeight", BaseFillViewportHeight);
const FillViewportWidth = makeDecoratable("FillViewportWidth", BaseFillViewportWidth);
const FillViewport = makeDecoratable("FillViewport", BaseFillViewport);

export { FillViewportHeight, FillViewportWidth, FillViewport };
