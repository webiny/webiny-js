import React from "react";
import { cn } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/react-composition";

interface ContentEntryFormContentProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string;
    /**
     * A notice about the entry, above the form and at the form's width.
     *
     * A slot rather than something the view renders beside this component, because this component
     * is the innermost thing in the decorator chain: extensions decorate it to put a panel beside
     * the form, and whatever they render wraps everything above them. A notice rendered as a
     * sibling of this one therefore spans the panels too — the revision warning used to run the
     * full width of the screen, over the top of the comments and activity drawers, saying
     * something about a form two thirds to its left. Rendered from here it cannot, whatever a
     * decorator does and in whatever order the decorators happen to be registered.
     */
    notice?: React.ReactNode;
}

export const ContentEntryFormContent = makeDecoratable(
    "Content",
    ({ children, className, width, notice, ...props }: ContentEntryFormContentProps) => {
        /*
          A column, so the notice sits above the form rather than beside it — and `max-w-full` on
          both, because `width` is the main axis in a row and the cross axis in a column. A row
          shrank an over-wide form to the space available; a column does not, so without the cap
          the 1020px form overflowed a narrower column in both directions and its left edge went
          off screen the moment two panels were open.
        */
        return (
            <div className={cn("flex flex-col items-center gap-md pt-xl", className)} {...props}>
                {/*
                  `empty:hidden` because a notice is usually absent: a component in this slot
                  decides for itself whether it has anything to say and returns null when it does
                  not, which leaves this element in the tree with nothing in it. Hidden, it stops
                  being a flex item, and the gap above the form closes with it.
                */}
                <div className={"max-w-full empty:hidden"} style={{ width }}>
                    {notice}
                </div>
                <div className={"max-w-full bg-neutral-base rounded-lg p-lg"} style={{ width }}>
                    {children}
                </div>
            </div>
        );
    }
);
