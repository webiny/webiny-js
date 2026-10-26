import React from "react";

/** One key, drawn as a key cap. A combination is one `Kbd` per key, side by side. */
export const Kbd = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex h-[22px] min-w-[22px] shrink-0 items-center justify-center gap-xxs rounded-sm border border-neutral-dimmed-darker bg-neutral-base px-[5px] text-[11px] leading-4 text-neutral-strong">
        {children}
    </span>
);

/** A shortcut's keys, each in its own cap. */
export const Keys = ({ keys }: { keys: React.ReactNode[] }) => (
    <span className="inline-flex shrink-0 items-center gap-xs">
        {keys.map((key, index) => (
            <Kbd key={index}>{key}</Kbd>
        ))}
    </span>
);
