import React, { useMemo, useState } from "react";
import {
    DataTable,
    type DataTableDefaultData,
    Icon,
    Link,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import { ReactComponent as LayoutIcon } from "@webiny/icons/space_dashboard.svg";
import { ReactComponent as LanguageVersionIcon } from "@webiny/icons/translate.svg";
import type { WbStatus } from "~/constants.js";
import type { Layout } from "~/features/layouts/index.js";
import { Routes } from "~/routes.js";
import type { LayoutsListPresenter } from "./abstractions.js";
import { LayoutActions } from "./LayoutActions.js";
import { LayoutLive, LayoutStatus } from "./LayoutStatus.js";
import { TranslateLayoutDialog } from "./TranslateLayoutDialog.js";

/**
 * A source layout, or one of its language versions as a sub-row under it.
 */
interface LayoutTableRow extends DataTableDefaultData {
    layout: Layout;
    title: string;
    // A language version is named by its source's slug, so it has none of its own.
    slug: string | null;
    languageLabel: string | null;
    status: WbStatus;
    version: number;
    liveVersion: number | null;
    author: string | null;
    savedOn: string | null;
    isDefault: boolean;
    // The source layout's row, for its actions; `null` on a language version.
    source: LayoutsListPresenter.RowViewModel | null;
    subRows?: LayoutTableRow[];
}

const toTableRow = (row: LayoutsListPresenter.RowViewModel): LayoutTableRow => {
    return {
        // The entry id, so a row stays expanded when a new revision is created.
        id: row.layout.entryId,
        layout: row.layout,
        title: row.title,
        slug: row.slug,
        languageLabel: row.languageLabel,
        status: row.status,
        version: row.version,
        liveVersion: row.liveVersion,
        author: row.author,
        savedOn: row.savedOn,
        isDefault: row.isDefault,
        source: row,
        subRows: row.versions.map(version => ({
            id: version.layout.entryId,
            layout: version.layout,
            title: version.title,
            slug: null,
            languageLabel: version.languageLabel,
            status: version.status,
            version: version.version,
            liveVersion: version.liveVersion,
            author: version.author,
            savedOn: version.savedOn,
            isDefault: false,
            source: null
        }))
    };
};

const getSubRows = (row: LayoutTableRow) => row.subRows;

const LayoutCellName = ({ row }: { row: LayoutTableRow }) => {
    const { getLink } = useRouter();
    const isVersion = !row.source;

    return (
        <Link
            to={getLink(Routes.Layouts.Editor, { id: row.layout.id })}
            variant={"secondary"}
            className={"truncate no-underline!"}
        >
            <div className={"flex flex-col gap-y-[3px]"}>
                <div className={"flex w-full items-center"}>
                    <Icon
                        size={"sm"}
                        color={"neutral-strong"}
                        className={"mr-xs"}
                        icon={isVersion ? <LanguageVersionIcon /> : <LayoutIcon />}
                        label={
                            isVersion ? `Language version - ${row.title}` : `Layout - ${row.title}`
                        }
                    />
                    <Text as={"div"} className={"truncate min-w-0 shrink"}>
                        {row.title}
                    </Text>
                    {row.isDefault ? (
                        <Tag variant={"accent-light"} content={"Default"} className={"ml-xs"} />
                    ) : null}
                </div>
                <Text as={"div"} size={"sm"} className={"text-neutral-dimmed truncate"}>
                    {isVersion ? "Language version" : (row.slug ?? "No slug")}
                </Text>
            </div>
        </Link>
    );
};

interface LayoutsTableProps {
    presenter: LayoutsListPresenter.Interface;
}

/**
 * Source layouts, each with its language versions as sub-rows.
 */
export const LayoutsTable = createReactiveComponent(({ presenter }: LayoutsTableProps) => {
    const { rows, loading } = presenter.vm;
    // The entry id of the source layout being translated.
    const [translatingId, setTranslatingId] = useState<string | null>(null);
    const translating = rows.find(row => row.layout.entryId === translatingId) ?? null;

    const data = useMemo(() => rows.map(toTableRow), [rows]);

    const columns = useMemo(
        () => ({
            title: {
                header: "Name",
                cell: (row: LayoutTableRow) => <LayoutCellName row={row} />,
                enableHiding: false,
                size: 240
            },
            languageLabel: {
                header: "Language",
                cell: (row: LayoutTableRow) => row.languageLabel ?? "-"
            },
            author: {
                header: "Author",
                cell: (row: LayoutTableRow) => row.author ?? "-"
            },
            savedOn: {
                header: "Modified",
                cell: (row: LayoutTableRow) =>
                    row.savedOn ? <TimeAgo datetime={row.savedOn} /> : "-"
            },
            status: {
                header: "Status",
                cell: (row: LayoutTableRow) => (
                    <LayoutStatus status={row.status} version={row.version} />
                ),
                truncate: false
            },
            liveVersion: {
                header: "Live",
                cell: (row: LayoutTableRow) => <LayoutLive liveVersion={row.liveVersion} />,
                truncate: false
            },
            actions: {
                header: "",
                cell: (row: LayoutTableRow) => (
                    <LayoutActions
                        presenter={presenter}
                        layout={row.layout}
                        row={row.source ?? undefined}
                        onTranslate={() => setTranslatingId(row.layout.entryId)}
                    />
                ),
                size: 56,
                enableResizing: false,
                enableHiding: false,
                truncate: false,
                className: "flex justify-center"
            }
        }),
        [presenter]
    );

    return (
        <>
            <DataTable<LayoutTableRow>
                columns={columns}
                data={data}
                loading={loading && !rows.length}
                getSubRows={getSubRows}
                initialExpanded={true}
                stickyHeader={true}
            />
            {translating ? (
                <TranslateLayoutDialog
                    presenter={presenter}
                    row={translating}
                    onClose={() => setTranslatingId(null)}
                />
            ) : null}
        </>
    );
});
