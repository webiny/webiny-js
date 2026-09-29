import React from "react";
import { Text } from "@webiny/admin-ui";

/** Sits in the input row so AI mode is unmistakable while the input itself never moves. */
export const AiModeBadge = () => (
    <span className="inline-flex shrink-0 items-center rounded-sm border border-primary-200 bg-primary-subtle px-sm py-xxs">
        <Text size="sm" className="font-semibold text-primary">
            Ask AI
        </Text>
    </span>
);
