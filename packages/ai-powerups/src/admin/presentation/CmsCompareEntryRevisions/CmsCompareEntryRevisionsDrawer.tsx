import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Drawer, Button, Checkbox, List, Text } from "@webiny/admin-ui";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import type { CmsCompareEntryRevisionsPresenter } from "./abstractions.js";

interface CmsCompareEntryRevisionsDrawerProps {
    presenter: CmsCompareEntryRevisionsPresenter.Interface;
}

const DateDisplay = ({ date }: { date: string }) => {
    const formatted = React.useMemo(() => {
        const d = new globalThis.Date(date);
        if (isNaN(d.getTime())) {
            return "";
        }
        return new Intl.DateTimeFormat(navigator.language, {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(d);
    }, [date]);
    return <>{formatted}</>;
};

export const CmsCompareEntryRevisionsDrawer = createReactiveComponent(
    ({ presenter }: CmsCompareEntryRevisionsDrawerProps) => {
        const formPresenter = useContentEntryFormPresenter();
        const { revisions, selectedIds, canCompare, drawerVisible } =
            presenter.vm;
        const modelId = formPresenter.vm.model.modelId;

        return (
            <Drawer
                title={"Compare entry revisions"}
                description={
                    "Select two revisions to compare their content using AI"
                }
                open={drawerVisible}
                onOpenChange={open => {
                    if (!open) {
                        presenter.hideDrawer();
                    }
                }}
                modal
                bodyPadding={false}
                headerSeparator
                width={800}
                actions={
                    <Button
                        variant={"primary"}
                        disabled={!canCompare}
                        onClick={() => presenter.compare(modelId)}
                        text={
                            canCompare
                                ? "Compare"
                                : `Select ${2 - selectedIds.length} revision${selectedIds.length === 1 ? "" : "s"}`
                        }
                        data-testid={
                            "cms.compare-revisions.compare-button"
                        }
                    />
                }
            >
                {revisions.length > 0 ? (
                    <List data-testid={"cms.compare-revisions.list"}>
                        {revisions.map(revision => {
                            const isSelected = selectedIds.includes(
                                revision.id
                            );
                            const isDisabled =
                                selectedIds.length >= 2 && !isSelected;

                            return (
                                <List.Item
                                    key={revision.id}
                                    icon={
                                        <div
                                            onClick={e =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() =>
                                                    presenter.toggleRevision(
                                                        revision.id
                                                    )
                                                }
                                                disabled={isDisabled}
                                                data-testid={`cms.compare-revisions.select-${revision.meta.version}`}
                                            />
                                        </div>
                                    }
                                    title={
                                        revision.meta.title || "N/A"
                                    }
                                    description={
                                        <Text as={"div"} size={"sm"}>
                                            Last modified by{" "}
                                            {revision.revisionCreatedBy
                                                ? revision
                                                      .revisionCreatedBy
                                                      .displayName
                                                : "Unknown"}{" "}
                                            on{" "}
                                            <DateDisplay
                                                date={
                                                    revision.revisionSavedOn
                                                }
                                            />{" "}
                                            (#{revision.meta.version})
                                        </Text>
                                    }
                                    onClick={() =>
                                        presenter.toggleRevision(
                                            revision.id
                                        )
                                    }
                                    data-testid={`cms.compare-revisions.item-${revision.meta.version}`}
                                />
                            );
                        })}
                    </List>
                ) : (
                    <div className={"p-lg"}>
                        No revisions to compare.
                    </div>
                )}
            </Drawer>
        );
    }
);
