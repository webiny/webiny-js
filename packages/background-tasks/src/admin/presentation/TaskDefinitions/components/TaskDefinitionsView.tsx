import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { DataTable, Heading, Separator, Text } from "@webiny/admin-ui";
import { TaskDefinitionsPresenterFeature } from "../feature.js";
import { ListDefinitionsFeature } from "~/admin/features/listDefinitions/feature.js";
import type { TaskDefinition } from "~/admin/shared/types.js";
import { TaskExecutionsButton } from "~/admin/presentation/TaskDefinitions/components/TaskExecutionsButton.js";

const TaskDefinitionsViewInner = observer(function TaskDefinitionsViewInner() {
    const { presenter } = useFeature(TaskDefinitionsPresenterFeature);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const columns = useMemo(
        () => ({
            title: {
                header: "Title",
                cell: (row: TaskDefinition) => <Text size="sm">{row.title || row.id}</Text>,
                enableSorting: false,
                size: 250
            },
            id: {
                header: "ID",
                cell: (row: TaskDefinition) => (
                    <Text size="sm" className="text-neutral-strong font-mono">
                        {row.id}
                    </Text>
                ),
                enableSorting: false,
                size: 250
            },
            description: {
                header: "Description",
                cell: (row: TaskDefinition) => (
                    <Text size="sm" className="text-neutral-strong">
                        {row.description || "—"}
                    </Text>
                ),
                enableSorting: false
            }
        }),
        []
    );

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Task Definitions</Heading>
                <TaskExecutionsButton />
            </div>
            <Separator />
            <div className="flex-1 overflow-auto">
                {!vm.loading && vm.definitions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-md">
                        <Text className="text-neutral-strong">No task definitions found.</Text>
                    </div>
                ) : (
                    <DataTable<TaskDefinition>
                        columns={columns}
                        data={vm.definitions}
                        loading={vm.loading}
                        stickyHeader
                    />
                )}
            </div>
        </div>
    );
});

export const TaskDefinitionsView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListDefinitionsFeature.register(child);
        TaskDefinitionsPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskDefinitionsViewInner />
        </DiContainerProvider>
    );
};
