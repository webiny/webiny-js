import React from "react";
import { Icon, Link, Text } from "@webiny/admin-ui";
import { ReactComponent as File } from "@webiny/icons/description.svg";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { FolderNameCell } from "./FolderNameCell.js";
import type { TenantEntry } from "~/admin/types.js";
import { useContentEntriesPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "@webiny/app-headless-cms";

interface TenantNameProps {
    tenant: TenantEntry;
}

const TenantName = ({ tenant }: TenantNameProps) => {
    const presenter = useContentEntriesPresenter();
    const { getLink } = useRouter();

    const url = getLink(Routes.ContentEntries.List, {
        modelId: presenter.vm.model?.modelId ?? "",
        folderId: presenter.folders.vm.currentFolderId ?? undefined,
        id: tenant.id
    });

    return (
        <div className={"flex flex-col gap-y-[3px]"}>
            <Link to={url} variant={"secondary"} className={"truncate no-underline!"}>
                <div className={"flex w-full items-center"}>
                    <Icon
                        size={"sm"}
                        color={"neutral-strong"}
                        className={"mr-xs"}
                        icon={<File />}
                        label={`Tenant - ${tenant.values.name}`}
                    />
                    <Text as={"div"} className={"truncate min-w-0 shrink"}>
                        {tenant.values.name}
                    </Text>
                </div>
            </Link>
            <Text as={"div"} size={"sm"} className={"text-neutral-dimmed"}>
                ID: {tenant.entryId}
            </Text>
        </div>
    );
};

export const TenantNameCell = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow<TenantEntry>();

    if (isFolderRow(row)) {
        return <FolderNameCell folder={row.data} />;
    }

    return <TenantName tenant={row.data} />;
};
