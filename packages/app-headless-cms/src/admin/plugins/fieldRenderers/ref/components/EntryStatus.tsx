import { OptionItem } from "~/admin/plugins/fieldRenderers/ref/components/types";
import React from "react";
import {
    getEntryStatus,
    getItemStatusText
} from "~/admin/plugins/fieldRenderers/ref/components/helpers";
import { Tooltip, TooltipProps } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishedIcon } from "~/admin/icons/published.svg";
import { ReactComponent as UnpublishedIcon } from "~/admin/icons/unpublished.svg";
import { ReactComponent as DraftIcon } from "~/admin/icons/draft.svg";
import styled from "@emotion/styled";

const EntryStatusText = styled("div")({
    display: "table-cell",
    verticalAlign: "middle"
});

const EntryStatusWrapper = styled("div")({
    display: "table"
});
const EntryStatusTooltip = styled("div")({
    display: "table-cell",
    width: "30px",
    verticalAlign: "middle"
});

interface EntryStatusProps {
    item: OptionItem | null;
    placement?: TooltipProps["placement"];
    className?: string;
    children?: React.ReactNode;
}
export const EntryStatus = (props: EntryStatusProps) => {
    const { item, children, placement = "bottom", className } = props;
    if (!item) {
        return <>{children}</>;
    }
    const status = getEntryStatus(item);
    const tooltipText = getItemStatusText(item);

    const published = status === "published";
    const unpublished = status === "unpublished";
    return (
        <EntryStatusWrapper className={className}>
            <EntryStatusTooltip>
                <Tooltip content={tooltipText} placement={placement}>
                    {published && <PublishedIcon />}
                    {unpublished && <UnpublishedIcon />}
                    {!published && !unpublished && <DraftIcon />}
                </Tooltip>
            </EntryStatusTooltip>
            {children && <EntryStatusText>{children}</EntryStatusText>}
        </EntryStatusWrapper>
    );
};
