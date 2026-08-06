import React from "react";
import { Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";

interface TokenValueBadgeProps {
    /** Display name of the referenced token, or `null` when the value is a literal. */
    reference: string | null;
    /** The resolved literal, shown when there is no reference. */
    literal: string | undefined;
    /** Full path of the referenced token, for the tooltip. */
    referencePath?: string;
}

/**
 * A slot pointing at a brand color and a slot holding a raw hex have to be distinguishable
 * without reading closely — see the design brief, "Things worth getting right".
 *
 * A reference is a bordered pill with a link icon and the primitive's display name; a literal is
 * bare monospace text. The difference is shape, not just color, so it survives at a glance and in
 * greyscale.
 */
export const TokenValueBadge = ({ reference, literal, referencePath }: TokenValueBadgeProps) => {
    if (reference === null) {
        return (
            <Text size="sm" className="flex-none font-mono text-neutral-strong">
                {literal ?? "—"}
            </Text>
        );
    }

    const badge = (
        <span className="flex-none inline-flex items-center gap-xs rounded-sm border border-neutral-dimmed-darker bg-neutral-light px-xs py-[2px] font-mono text-sm whitespace-nowrap">
            <LinkIcon className="size-3 fill-neutral-strong" />
            {reference}
        </span>
    );

    if (!referencePath) {
        return badge;
    }

    return (
        <Tooltip
            content={`${referencePath}${literal ? ` · ${literal}` : ""}`}
            trigger={badge}
            rawTrigger={true}
        />
    );
};
