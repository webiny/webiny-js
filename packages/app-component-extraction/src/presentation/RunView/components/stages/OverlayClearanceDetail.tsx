import React from "react";
import { Tag, Text } from "@webiny/admin-ui";
import type { OverlayClearanceDto, OverlayPassDto } from "~/shared/types.js";

interface Props {
    clearance?: OverlayClearanceDto;
    /** What the pass found still covering the page afterwards, from the page's warnings. */
    overlayRemains?: string | null;
}

const isEmpty = (pass?: OverlayPassDto): boolean =>
    !pass ||
    (pass.hidden.length === 0 &&
        pass.dismissed.length === 0 &&
        pass.removed.length === 0 &&
        !pass.unlockedScroll);

/** One pass's entries, or nothing at all when it had nothing to do. */
const PassBlock = ({ title, why, pass }: { title: string; why: string; pass?: OverlayPassDto }) => {
    if (isEmpty(pass)) {
        return (
            <div className="flex flex-col gap-xxs">
                <Text size="sm" className="font-medium">
                    {title}
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    Nothing on this page.
                </Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-xxs">
            <Text size="sm" className="font-medium">
                {title}
            </Text>
            <Text size="sm" className="text-neutral-strong">
                {why}
            </Text>

            {pass!.removed.length > 0 ? (
                <div className="flex flex-col gap-xxs">
                    {/* First and most prominent: the only list where the capture acted against a page
                        that offered no way out, so it is what to read when a section is missing. */}
                    <Text size="sm" className="font-medium text-warning">
                        Removed ({pass!.removed.length})
                    </Text>
                    {pass!.removed.map(entry => (
                        <Text
                            key={entry}
                            size="sm"
                            className="font-mono break-words text-neutral-strong"
                        >
                            {entry}
                        </Text>
                    ))}
                </div>
            ) : null}

            {pass!.dismissed.length > 0 ? (
                <div className="flex flex-col gap-xxs">
                    <Text size="sm" className="font-medium">
                        Closed ({pass!.dismissed.length})
                    </Text>
                    {pass!.dismissed.map(entry => (
                        <Text
                            key={entry}
                            size="sm"
                            className="font-mono break-words text-neutral-strong"
                        >
                            {entry}
                        </Text>
                    ))}
                </div>
            ) : null}

            {pass!.hidden.length > 0 ? (
                <Text size="sm" className="text-neutral-strong">
                    Consent banners hidden: {pass!.hidden.join(", ")}
                </Text>
            ) : null}

            {pass!.unlockedScroll ? (
                <Text size="sm" className="text-neutral-strong">
                    A scroll lock was lifted.
                </Text>
            ) : null}
        </div>
    );
};

/**
 * What the overlay pass did to a page, per spec §6.2.
 *
 * The two passes are shown separately rather than added together, because they protect different
 * things and a reader needs to know which. The early pass runs before the page is sampled, so it
 * decides what the element tree — and therefore every section Segment cuts — contains. The late pass
 * runs immediately before the camera, so it decides what the screenshot shows. An overlay only the
 * late pass caught was never in the tree but would have been in the picture; one only the early pass
 * caught is the reverse. Summed, those are indistinguishable.
 */
export const OverlayClearanceDetail = ({ clearance, overlayRemains }: Props) => {
    if (!clearance && !overlayRemains) {
        return null;
    }

    const quiet = isEmpty(clearance?.early) && isEmpty(clearance?.late) && !overlayRemains;
    if (quiet) {
        return (
            <Text size="sm" className="text-neutral-strong">
                Nothing was covering this page.
            </Text>
        );
    }

    return (
        <div className="flex flex-col gap-sm">
            {overlayRemains ? (
                <div className="flex flex-col gap-xxs">
                    <Tag variant="warning" content="an overlay survived" />
                    <Text size="sm" className="break-words text-neutral-strong">
                        {/* The screenshot has this in it, and every crop taken from it does too. */}
                        Still covering the page when it was photographed: {overlayRemains}
                    </Text>
                </div>
            ) : null}

            <PassBlock
                title="Before sampling"
                why="Decides what the element tree contains, and so what Segment can cut into sections."
                pass={clearance?.early}
            />
            <PassBlock
                title="Before the screenshot"
                why="Decides what the image contains, and so what every crop taken from it shows."
                pass={clearance?.late}
            />
        </div>
    );
};
