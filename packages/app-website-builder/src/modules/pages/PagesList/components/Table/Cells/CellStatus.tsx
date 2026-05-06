import React, { useCallback, useMemo } from "react";
import { IconButton, Tag } from "@webiny/admin-ui";
import { ReactComponent as NewTab } from "@webiny/icons/open_in_new.svg";
import { PageListConfig } from "~/modules/pages/configs/index.js";
import { toTitleCaseLabel } from "~/shared/toTitleCaseLabel.js";
import { usePagePreviewLink } from "~/modules/pages/PagesList/hooks/usePagePreviewLink.js";
import { usePageLink } from "~/modules/pages/PagesList/hooks/usePageLink.js";
import type { PageDto } from "~/domain/Page/index.js";

const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;

export const CellStatus = () => {
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const variant = useMemo(() => {
        switch (row.data.status) {
            case "published":
                return "success";
            case "unpublished":
                return "warning";
            default:
                return "neutral-light";
        }
    }, [row.data.status]);

    const statusLabel = useMemo(() => {
        return toTitleCaseLabel(row.data.status);
    }, [row.data.status]);

    return (
        <div className={"flex items-center"}>
            <Tag
                variant={variant}
                content={`${statusLabel}${row.data.version ? ` (v${row.data.version})` : ""}`}
            />
            <PreviewLink page={row.data} />
        </div>
    );
};

const PreviewLink = ({ page }: { page: PageDto }) => {
    const previewLink = usePagePreviewLink(page);
    const pageLink = usePageLink(page);
    const link = page.status === "published" ? pageLink : previewLink;

    const openInNewTab = useCallback(() => {
        if (link) {
            window.open(link, "_blank");
        }
    }, [link]);

    return link ? (
        <IconButton
            onClick={openInNewTab}
            icon={<NewTab />}
            title={page.status === "published" ? "Open in new tab" : "Preview in new tab"}
            size={"sm"}
            variant={"ghost"}
        />
    ) : null;
};
