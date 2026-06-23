import React from "react";
import { useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import { Button, DropdownMenu, Text } from "@webiny/admin-ui";
import { useRoute, useRouter } from "@webiny/app-admin";
import { ReactComponent as DownButton } from "@webiny/icons/keyboard_arrow_down.svg";
import { statuses } from "~/admin/constants.js";
import { Routes } from "~/routes.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "~/presentation/contentEntries/revisionsList/feature.js";

const getStatusLabel = (status: string): string => {
    return (statuses as Record<string, string>)[status] || status;
};

export const RevisionSelector = observer(() => {
    const { vm } = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const currentRevision = {
        version: vm.entry?.meta?.version || 1,
        status: vm.entry?.meta?.status || "draft"
    };

    const revisions = revisionsPresenter.vm.revisions;

    if (!revisions.length) {
        return null;
    }

    const firstFiveRevisions = revisions.slice(0, 5);

    return (
        <DropdownMenu
            trigger={
                <Button
                    variant={"ghost"}
                    disabled={vm.loading !== null}
                    icon={<DownButton />}
                    iconPosition={"end"}
                    text={
                        <>
                            v{currentRevision.version} ({getStatusLabel(currentRevision.status)})
                        </>
                    }
                />
            }
        >
            {firstFiveRevisions.map(revision => (
                <DropdownMenu.Item
                    key={revision.id}
                    onClick={() => {
                        goToRoute(Routes.ContentEntries.List, {
                            ...route.params,
                            id: revision.id
                        });
                    }}
                    text={
                        <Text size={"sm"}>
                            v{revision.meta.version} ({getStatusLabel(revision.meta.status)})
                        </Text>
                    }
                />
            ))}
            {revisions.length > 5 ? (
                <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        key={"revisions-all"}
                        onClick={() => revisionsPresenter.show()}
                        text={<Text size={"sm"}>Show All Revisions</Text>}
                    />
                </>
            ) : null}
        </DropdownMenu>
    );
});
