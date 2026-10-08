import React from "react";
import { useId } from "react";

interface SparklineProps {
    values: number[];
    width?: number;
    height?: number;
}

// A small trend line with a gradient wash and a marked last point. No axes: the tile's number
// carries the value, the line only shows the shape.
export const Sparkline = ({ values, width = 120, height = 40 }: SparklineProps) => {
    const gradientId = useId();
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const inset = 5;
    const step = (width - inset * 2) / (values.length - 1);

    const x = (index: number) => inset + index * step;
    const y = (value: number) => inset + (1 - (value - min) / range) * (height - inset * 2);

    const points = values.map((value, index) => `${x(index)},${y(value)}`);
    const line = `M${points.join(" L")}`;
    const lastIndex = values.length - 1;
    const area = `${line} L${x(lastIndex)},${height} L${x(0)},${height} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden>
            <defs>
                <linearGradient id={gradientId} x1={"0"} y1={"0"} x2={"0"} y2={"1"}>
                    <stop offset={"0%"} stopColor={"var(--color-primary-500)"} stopOpacity={0.28} />
                    <stop offset={"100%"} stopColor={"var(--color-primary-500)"} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
                d={line}
                fill={"none"}
                stroke={"var(--color-primary-500)"}
                strokeWidth={2}
                strokeLinejoin={"round"}
                strokeLinecap={"round"}
            />
            <circle
                cx={x(lastIndex)}
                cy={y(values[lastIndex])}
                r={4}
                fill={"var(--color-primary-500)"}
                stroke={"var(--color-neutral-0)"}
                strokeWidth={2}
            />
        </svg>
    );
};
