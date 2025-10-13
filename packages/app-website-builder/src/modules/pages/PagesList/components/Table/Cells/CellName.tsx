import React from "react";
import { Icon, Link, Text } from "@webiny/admin-ui";
import { ReactComponent as File } from "@webiny/icons/description.svg";
import { PageListConfig } from "~/modules/pages/configs/index.js";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";
import { FolderCellName } from "~/modules/shared/FolderCellName.js";
import type { PageDto } from "~/domain/Page/index.js";

interface PageCellRowTitleProps {
    page: PageDto;
}

const PageCellRowTitle = ({ page }: PageCellRowTitleProps) => {
    return (
        <div className={"flex flex-col gap-y-[3px]"}>
            <div className={"flex w-full items-center"}>
                <Icon
                    size={"sm"}
                    color={"neutral-strong"}
                    className={"mr-xs"}
                    icon={<File />}
                    label={`Page - ${page.properties.title}`}
                />
                <Text as={"div"} className={"truncate min-w-0 flex-shrink"}>
                    {page.properties.title}
                </Text>
            </div>
            <Text as={"div"} size={"sm"} className={"text-neutral-dimmed"}>
                {page.properties.path}
            </Text>
        </div>
    );
};

interface EntryCellNameProps {
    page: PageDto;
}

export const PageCellName = ({ page }: EntryCellNameProps) => {
    const { getEditPageUrl } = useEditPageUrl();

    return (
        <Link
            to={getEditPageUrl(page.id)}
            variant={"secondary"}
            className={"truncate !no-underline"}
        >
            <PageCellRowTitle page={page} />
        </Link>
    );
};

export const CellName = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <FolderCellName folder={row.data} />;
    }

    return <PageCellName page={row.data} />;
};
