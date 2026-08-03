import React from "react";

interface BetaBadgeProps {
    text?: React.ReactNode;
}

const BetaBadge = ({ text = "beta" }: BetaBadgeProps) => {
    return (
        <span
            className={
                "inline-flex items-center rounded-sm bg-primary/50 px-xs text-[10px] font-semibold text-neutral-light leading-none h-md shrink-0"
            }
        >
            {text}
        </span>
    );
};

export { BetaBadge, type BetaBadgeProps };
