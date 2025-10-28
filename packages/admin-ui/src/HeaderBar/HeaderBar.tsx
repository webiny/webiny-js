import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { Separator } from "~/Separator/index.js";

interface HeaderBarProps extends React.HTMLAttributes<HTMLDivElement> {
    start?: React.ReactNode;
    middle?: React.ReactNode;
    end?: React.ReactNode;
}

const HeaderBarBase = ({ start, middle, end, className, ...props }: HeaderBarProps) => {
    return (
        <header>
            <div
                className={cn(
                    "grid grid-cols-[1fr_auto_1fr] w-full py-xs-plus px-sm bg-neutral-base",
                    className
                )}
                {...props}
            >
                <div className="h-full flex items-center justify-self-start">{start}</div>
                <div className="h-full flex items-center">{middle}</div>
                <div className="h-full flex items-center justify-self-end">{end}</div>
            </div>
            <Separator />
        </header>
    );
};

const HeaderBar = makeDecoratable("HeaderBar", HeaderBarBase);

export { HeaderBar, type HeaderBarProps };
