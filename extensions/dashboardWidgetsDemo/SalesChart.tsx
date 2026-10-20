import React from "react";
import { useId } from "react";
import { useState } from "react";
import { cn } from "webiny/admin/ui";
import { smoothPath } from "./smoothPath.js";

export interface SalesDay {
    label: string;
    amount: number;
}

interface SalesChartProps {
    days: SalesDay[];
}

const WIDTH = 400;
const HEIGHT = 180;
const PADDING = { top: 28, right: 12, bottom: 24, left: 52 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const Y_TICKS = 3;

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
});

const compact = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
});

function anchorFor(index: number, count: number): "start" | "middle" | "end" {
    if (index === 0) {
        return "start";
    }
    if (index === count - 1) {
        return "end";
    }
    return "middle";
}

// Rounds the top of the scale up to a tidy number, so gridlines land on readable values.
function niceMax(value: number): number {
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const step = magnitude / 2;
    return Math.ceil(value / step) * step;
}

export const SalesChart = ({ days }: SalesChartProps) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const gradientId = useId();
    const glowId = useId();

    const amounts = days.map(day => day.amount);
    const highest = Math.max(...amounts);
    const max = niceMax(highest);
    const stepX = PLOT_WIDTH / (days.length - 1);
    const lastIndex = days.length - 1;

    const x = (index: number) => PADDING.left + index * stepX;
    const y = (amount: number) => PADDING.top + PLOT_HEIGHT - (amount / max) * PLOT_HEIGHT;

    const points = days.map((day, index) => ({ x: x(index), y: y(day.amount) }));
    const line = smoothPath(points);
    const baseline = PADDING.top + PLOT_HEIGHT;
    const area = `${line} L${x(lastIndex)},${baseline} L${x(0)},${baseline} Z`;

    const ticks = Array.from({ length: Y_TICKS + 1 }, (_, i) => (max / Y_TICKS) * i);
    // First, middle and last day: enough to read the range without crowding the axis.
    const labelled = [0, Math.floor(lastIndex / 2), lastIndex];

    // The marked day: the hovered one, otherwise the latest.
    const marked = hovered ?? lastIndex;
    const markedDay = days[marked];

    let tooltip = null;
    if (hovered !== null) {
        const left = (x(hovered) / WIDTH) * 100;
        const top = (y(markedDay.amount) / HEIGHT) * 100;
        tooltip = (
            <div
                className={cn(
                    "pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-sm",
                    "bg-neutral-dark px-sm py-xs text-sm whitespace-nowrap text-neutral-light shadow-md"
                )}
                style={{ left: `${left}%`, top: `calc(${top}% - 14px)` }}
            >
                <div className={"font-semibold"}>{currency.format(markedDay.amount)}</div>
                <div className={"text-neutral-dimmed"}>{markedDay.label}</div>
            </div>
        );
    }

    return (
        <div className={"relative"}>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className={"block w-full overflow-visible"}
                role={"img"}
                aria-label={`Daily sales for the last ${days.length} days`}
                onMouseLeave={() => setHovered(null)}
            >
                <defs>
                    <linearGradient id={gradientId} x1={"0"} y1={"0"} x2={"0"} y2={"1"}>
                        <stop
                            offset={"0%"}
                            stopColor={"var(--color-primary-500)"}
                            stopOpacity={0.32}
                        />
                        <stop
                            offset={"100%"}
                            stopColor={"var(--color-primary-500)"}
                            stopOpacity={0}
                        />
                    </linearGradient>
                    <radialGradient id={glowId}>
                        <stop
                            offset={"0%"}
                            stopColor={"var(--color-primary-500)"}
                            stopOpacity={0.45}
                        />
                        <stop
                            offset={"100%"}
                            stopColor={"var(--color-primary-500)"}
                            stopOpacity={0}
                        />
                    </radialGradient>
                </defs>
                {ticks.map(tick => (
                    <g key={tick}>
                        <line
                            x1={PADDING.left}
                            x2={WIDTH - PADDING.right}
                            y1={y(tick)}
                            y2={y(tick)}
                            stroke={"var(--color-neutral-200)"}
                            strokeWidth={1}
                        />
                        <text
                            x={PADDING.left - 10}
                            y={y(tick)}
                            textAnchor={"end"}
                            dominantBaseline={"middle"}
                            fontSize={11}
                            fill={"var(--text-color-neutral-strong)"}
                        >
                            {compact.format(tick)}
                        </text>
                    </g>
                ))}
                {labelled.map(index => (
                    <text
                        key={index}
                        x={x(index)}
                        y={HEIGHT - 4}
                        textAnchor={anchorFor(index, days.length)}
                        fontSize={11}
                        fill={"var(--text-color-neutral-strong)"}
                    >
                        {days[index].label}
                    </text>
                ))}
                <path d={area} fill={`url(#${gradientId})`} />
                <path
                    d={line}
                    fill={"none"}
                    stroke={"var(--color-primary-500)"}
                    strokeWidth={2.5}
                    strokeLinejoin={"round"}
                    strokeLinecap={"round"}
                />
                {hovered !== null && (
                    <line
                        x1={x(hovered)}
                        x2={x(hovered)}
                        y1={PADDING.top}
                        y2={baseline}
                        stroke={"var(--color-neutral-400)"}
                        strokeWidth={1}
                    />
                )}
                <circle cx={x(marked)} cy={y(markedDay.amount)} r={16} fill={`url(#${glowId})`} />
                <circle
                    cx={x(marked)}
                    cy={y(markedDay.amount)}
                    r={5}
                    fill={"var(--color-primary-500)"}
                    stroke={"var(--color-neutral-0)"}
                    strokeWidth={2}
                />
                {/* The latest value is labelled directly; the tooltip takes over while hovering. */}
                {hovered === null && (
                    <text
                        x={x(lastIndex)}
                        y={y(days[lastIndex].amount) - 16}
                        textAnchor={"end"}
                        fontSize={12}
                        fontWeight={600}
                        fill={"var(--text-color-neutral-primary)"}
                    >
                        {currency.format(days[lastIndex].amount)}
                    </text>
                )}
                {/* One full-height hit area per day, wider than the line, for the hover. */}
                {days.map((day, index) => (
                    <rect
                        key={day.label}
                        x={x(index) - stepX / 2}
                        y={PADDING.top}
                        width={stepX}
                        height={PLOT_HEIGHT}
                        fill={"transparent"}
                        onMouseEnter={() => setHovered(index)}
                    />
                ))}
            </svg>
            {tooltip}
            <table className={"sr-only"}>
                <caption>Daily sales</caption>
                <tbody>
                    {days.map(day => (
                        <tr key={day.label}>
                            <th scope={"row"}>{day.label}</th>
                            <td>{currency.format(day.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
