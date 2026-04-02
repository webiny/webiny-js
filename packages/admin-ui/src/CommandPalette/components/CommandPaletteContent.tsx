import * as React from "react";
import { Dialog as DialogPrimitive, VisuallyHidden } from "radix-ui";
import { cn } from "~/utils.js";

interface CommandPaletteContentProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

const CommandPaletteContent = ({ open, onOpenChange, children }: CommandPaletteContentProps) => {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        "z-overlay",
                        "fixed inset-0 bg-neutral-dark/50",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                    )}
                />
                <DialogPrimitive.Content
                    className={cn(
                        "fixed left-[50%] top-[20%] translate-x-[-50%] w-[640px]",
                        "max-w-[calc(100vw-var(--spacing-lg))]",
                        "bg-neutral-base rounded-xl shadow-lg border-none",
                        "overflow-hidden focus:outline-none",
                        "z-overlay",
                        "duration-200",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    )}
                    aria-describedby={undefined}
                >
                    <VisuallyHidden.Root>
                        <DialogPrimitive.Title></DialogPrimitive.Title>
                    </VisuallyHidden.Root>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export { CommandPaletteContent };
