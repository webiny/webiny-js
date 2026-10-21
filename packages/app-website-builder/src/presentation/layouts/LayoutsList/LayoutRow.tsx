import React, { useState } from "react";
import { Tag, Text } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import type { LayoutsListPresenter } from "./abstractions.js";
import { TranslateLayoutDialog } from "./TranslateLayoutDialog.js";
import { LayoutStatus } from "./LayoutStatus.js";
import { LayoutActions } from "./LayoutActions.js";

export const LAYOUT_ROW_GRID =
    "grid grid-cols-[minmax(0,1fr)_180px_160px_180px_80px_48px] items-center gap-sm";

interface LayoutRowProps {
    presenter: LayoutsListPresenter.Interface;
    row: LayoutsListPresenter.RowViewModel;
}

/**
 * A source layout, with its language versions listed under it.
 */
export const LayoutRow = ({ presenter, row }: LayoutRowProps) => {
    const { goToRoute } = useRouter();
    const [translating, setTranslating] = useState(false);

    return (
        <div className={"border-b-sm border-neutral-dimmed"}>
            <div className={`${LAYOUT_ROW_GRID} px-md py-sm`}>
                <button
                    type={"button"}
                    className={"flex items-center gap-sm text-left cursor-pointer min-w-0"}
                    onClick={() => goToRoute(Routes.Layouts.Editor, { id: row.layout.id })}
                >
                    <Text size={"md"} className={"font-semibold text-neutral-primary truncate"}>
                        {row.title}
                    </Text>
                    {row.isDefault ? <Tag variant={"accent-light"} content={"Default"} /> : null}
                </button>
                <Text size={"sm"} className={"text-neutral-primary truncate"}>
                    {row.slug ?? "-"}
                </Text>
                <Text size={"sm"} className={"text-neutral-primary"}>
                    {row.languageLabel ?? "-"}
                </Text>
                <LayoutStatus status={row.status} liveVersion={row.liveVersion} />
                <Text size={"sm"} className={"text-neutral-primary"}>
                    {`v${row.version}`}
                </Text>
                <LayoutActions
                    presenter={presenter}
                    layout={row.layout}
                    row={row}
                    onTranslate={() => setTranslating(true)}
                />
            </div>
            {row.versions.map(version => (
                <div
                    key={version.layout.id}
                    className={`${LAYOUT_ROW_GRID} pl-xl pr-md py-xs bg-neutral-subtle`}
                >
                    <button
                        type={"button"}
                        className={"flex items-center gap-sm text-left cursor-pointer min-w-0"}
                        onClick={() => goToRoute(Routes.Layouts.Editor, { id: version.layout.id })}
                    >
                        <Text size={"sm"} className={"text-neutral-muted truncate"}>
                            {`${row.title} - language version`}
                        </Text>
                    </button>
                    {/* A language version is named by its source's slug. */}
                    <span />
                    <Text size={"sm"} className={"text-neutral-primary"}>
                        {version.languageLabel}
                    </Text>
                    <LayoutStatus status={version.status} liveVersion={version.liveVersion} />
                    <Text size={"sm"} className={"text-neutral-primary"}>
                        {`v${version.version}`}
                    </Text>
                    <LayoutActions presenter={presenter} layout={version.layout} />
                </div>
            ))}
            {translating ? (
                <TranslateLayoutDialog
                    presenter={presenter}
                    row={row}
                    onClose={() => setTranslating(false)}
                />
            ) : null}
        </div>
    );
};
