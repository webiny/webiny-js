import React from "react";
import { observer } from "mobx-react-lite";
import { Drawer, Loader } from "@webiny/admin-ui";
import { DocsRootView } from "./DocsRootView.js";
import { DocsTypeView } from "./DocsTypeView.js";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsExplorerDrawerProps {
    presenter: DocsExplorerPresenter.Interface;
}

const DrawerHeader = (props: { presenter: DocsExplorerPresenter.Interface }) => {
    const { breadcrumbs } = props.presenter.vm;

    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 text-sm">
            <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit"
                onClick={() => props.presenter.navigateBack()}
            >
                &larr; Back
            </button>
            <span className="text-gray-400">|</span>
            <button
                className="text-blue-600 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit"
                onClick={() => props.presenter.navigateToRoot()}
            >
                Root
            </button>
            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                    <span className="text-gray-400">/</span>
                    <span
                        className={
                            index === breadcrumbs.length - 1
                                ? "text-gray-900 font-bold"
                                : "text-gray-500"
                        }
                    >
                        {crumb}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

const DrawerBody = (props: { presenter: DocsExplorerPresenter.Interface }) => {
    const { currentView, schemaStatus } = props.presenter.vm;

    if (schemaStatus === "loading" && !currentView) {
        return (
            <div className="flex items-center justify-center gap-2 p-8 text-gray-500">
                <Loader size="sm" />
                <span>Loading schema...</span>
            </div>
        );
    }

    if (!currentView) {
        return <div className="p-8 text-center text-gray-400 text-sm">No schema available.</div>;
    }

    if (currentView.kind === "root") {
        return <DocsRootView rootView={currentView} presenter={props.presenter} />;
    }

    return <DocsTypeView typeView={currentView} presenter={props.presenter} />;
};

export const DocsExplorerDrawer = observer((props: DocsExplorerDrawerProps) => {
    const { presenter } = props;

    return (
        <Drawer
            title="Schema Docs"
            open={presenter.vm.open}
            onOpenChange={open => {
                if (open) {
                    return;
                }
                presenter.toggle();
            }}
            modal={false}
            bodyPadding={false}
            headerSeparator={true}
            width={"40%"}
        >
            <DrawerHeader presenter={presenter} />
            <DrawerBody presenter={presenter} />
        </Drawer>
    );
});
