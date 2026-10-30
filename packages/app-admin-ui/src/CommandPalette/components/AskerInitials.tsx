import React from "react";
import { Text } from "@webiny/admin-ui";

/** Who asked, as initials in a small circle at the start of each question. */
export const AskerInitials = ({ initials }: { initials: string }) => (
    <span className="grid size-lg shrink-0 place-items-center rounded-full bg-neutral-dimmed">
        <Text size="sm" className="text-[10px] font-semibold uppercase text-neutral-strong">
            {initials}
        </Text>
    </span>
);
