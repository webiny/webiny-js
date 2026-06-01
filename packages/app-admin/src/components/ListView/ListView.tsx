import React, { useMemo } from "react";
import { LeftPanel, RightPanel, SplitView } from "~/components/SplitView/SplitView.js";
import { ListViewProvider } from "./context.js";
import type { IListViewModel, IListActions } from "~/presentation/listPresenter/abstractions.js";

interface ListViewProps {
    list: IListViewModel<any>;
    actions: IListActions;
    showingFilters?: boolean;
    onToggleFilters?: () => void;
    namespace: string;
    sidebar?: React.ReactNode;
    header?: React.ReactNode;
    bulkActions?: React.ReactNode;
    filters?: React.ReactNode;
    content: React.ReactNode;
    bottomBar?: React.ReactNode;
}

const ListViewBase = ({
    list,
    actions,
    showingFilters = false,
    onToggleFilters,
    namespace,
    sidebar,
    header,
    bulkActions,
    filters,
    content,
    bottomBar
}: ListViewProps) => {
    const ctx = useMemo(
        () => ({ list, actions, showingFilters, onToggleFilters }),
        [list, actions, showingFilters, onToggleFilters]
    );

    const mainContent = (
        <div className={"h-full relative overflow-hidden"}>
            {header}
            <div
                style={{ top: "105px" }}
                className={"w-full overflow-hidden absolute top-0 bottom-0 left-0"}
            >
                {bulkActions}
                {filters}
                {content}
                {bottomBar}
            </div>
        </div>
    );

    return (
        <ListViewProvider value={ctx}>
            {sidebar ? (
                <SplitView namespace={namespace}>
                    <LeftPanel span={2}>{sidebar}</LeftPanel>
                    <RightPanel span={10}>{mainContent}</RightPanel>
                </SplitView>
            ) : (
                mainContent
            )}
        </ListViewProvider>
    );
};

export { ListViewBase, type ListViewProps };
