import React, { useEffect, useRef, useState } from "react";
import { makeDecoratable } from "~/utils.js";

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

const BaseFillViewportHeight = ({ children, style: userStyle, ...rest }: FillViewportProps) => {
    const { ref, style } = useFillViewportStyle("height");

    return (
        <div
            {...rest}
            ref={ref}
            data-fill-viewport="height"
            style={style !== undefined ? { height: style.height, ...userStyle } : userStyle}
        >
            {children}
        </div>
    );
};

const BaseFillViewportWidth = ({ children, style: userStyle, ...rest }: FillViewportProps) => {
    const { ref, style } = useFillViewportStyle("width");

    return (
        <div
            {...rest}
            ref={ref}
            data-fill-viewport="width"
            style={style !== undefined ? { width: style.width, ...userStyle } : userStyle}
        >
            {children}
        </div>
    );
};

const BaseFillViewport = ({ children, style: userStyle, ...rest }: FillViewportProps) => {
    const { ref, style } = useFillViewportStyle("both");

    return (
        <div
            {...rest}
            ref={ref}
            data-fill-viewport="both"
            style={style !== undefined ? { ...style, ...userStyle } : userStyle}
        >
            {children}
        </div>
    );
};

const FillViewportHeight = makeDecoratable("FillViewportHeight", BaseFillViewportHeight);
const FillViewportWidth = makeDecoratable("FillViewportWidth", BaseFillViewportWidth);
const FillViewport = makeDecoratable("FillViewport", BaseFillViewport);

export { FillViewportHeight, FillViewportWidth, FillViewport };
