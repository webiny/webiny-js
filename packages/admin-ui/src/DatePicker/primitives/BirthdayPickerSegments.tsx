import React from "react";
import { cn } from "~/utils.js";
import { type BirthdayParts, type BirthdayStep, pad } from "../utils/birthdayHelpers.js";

interface BirthdayPickerSegmentsProps {
    parts: BirthdayParts;
    activeStep?: BirthdayStep;
    onStepClick?: (step: BirthdayStep) => void;
}

const BirthdayPickerSegments = ({
    parts,
    activeStep,
    onStepClick
}: BirthdayPickerSegmentsProps) => {
    const segments: Array<{ step: BirthdayStep; text: string; filled: boolean }> = [
        { step: "day", text: parts.day ? pad(parts.day) : "DD", filled: !!parts.day },
        { step: "month", text: parts.month ? pad(parts.month) : "MM", filled: !!parts.month },
        { step: "year", text: parts.year ? String(parts.year) : "YYYY", filled: !!parts.year }
    ];

    return (
        <span className="flex items-center gap-xs tabular-nums whitespace-nowrap">
            {segments.map((segment, index) => {
                // A filled part takes the input's value colour; an empty one reads as its placeholder.
                const className = cn(
                    "transition-colors",
                    !segment.filled && "text-neutral-dimmed",
                    activeStep === segment.step && "text-accent-primary"
                );
                return (
                    <React.Fragment key={segment.step}>
                        {index > 0 ? <span className="text-neutral-dimmed">/</span> : null}
                        {onStepClick ? (
                            <button
                                type="button"
                                tabIndex={-1}
                                data-step={segment.step}
                                className={cn(className, "cursor-pointer outline-none")}
                                onClick={() => onStepClick(segment.step)}
                            >
                                {segment.text}
                            </button>
                        ) : (
                            <span className={className}>{segment.text}</span>
                        )}
                    </React.Fragment>
                );
            })}
        </span>
    );
};

export { BirthdayPickerSegments };
