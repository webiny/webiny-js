import React from "react";
import { useCallback } from "react";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { PlaygroundPresenter } from "../abstractions.js";
import { TabContextMenu } from "./TabContextMenu.js";
import { EndpointSelector } from "./EndpointSelector.js";

interface TabBarProps {
    presenter: PlaygroundPresenter.Interface;
}

interface ContextMenuState {
    tabId: string;
    isRegistered: boolean;
    x: number;
    y: number;
}

interface EndpointSelectorState {
    x: number;
    y: number;
}

export const TabBar = observer((props: TabBarProps) => {
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [endpointSelector, setEndpointSelector] = useState<EndpointSelectorState | null>(null);
    const vm = props.presenter.vm;

    const handleTabClick = useCallback(
        (id: string) => {
            props.presenter.selectTab(id);
        },
        [props.presenter]
    );

    const handleCloseTab = useCallback(
        (ev: React.MouseEvent, id: string) => {
            ev.stopPropagation();
            props.presenter.closeTab(id);
        },
        [props.presenter]
    );

    const handleContextMenu = useCallback(
        (ev: React.MouseEvent, tabId: string, isRegistered: boolean) => {
            ev.preventDefault();
            setContextMenu({
                tabId,
                isRegistered,
                x: ev.clientX,
                y: ev.clientY
            });
        },
        []
    );

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleAddClick = useCallback((ev: React.MouseEvent) => {
        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
        setEndpointSelector({
            x: rect.left,
            y: rect.bottom + 4
        });
    }, []);

    const handleCloseEndpointSelector = useCallback(() => {
        setEndpointSelector(null);
    }, []);

    return (
        <div className="flex items-center bg-neutral-subtle border-b border-neutral-dimmed overflow-x-auto">
            {vm.tabs.map(tab => {
                const isActive = tab.id === vm.activeTabId;

                return (
                    <div
                        key={tab.id}
                        className={`flex items-center gap-1 px-3 py-2 cursor-pointer border-r border-neutral-dimmed min-w-0 shrink-0 ${
                            isActive
                                ? "bg-neutral-base border-b-2 border-b-accent-default"
                                : "hover:bg-neutral-light"
                        }`}
                        onClick={() => handleTabClick(tab.id)}
                        onContextMenu={ev => handleContextMenu(ev, tab.id, tab.isRegistered)}
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{tab.name}</span>
                            <span className="text-[10px] text-neutral-dimmed truncate max-w-32">
                                {tab.endpoint}
                            </span>
                        </div>
                        <TabCloseButton
                            isRegistered={tab.isRegistered}
                            tabId={tab.id}
                            onClose={handleCloseTab}
                        />
                    </div>
                );
            })}
            <button
                className="flex items-center justify-center px-2 py-2 hover:bg-neutral-light shrink-0"
                onClick={handleAddClick}
                title="New tab"
            >
                <AddIcon className="w-4 h-4 text-neutral-muted" />
            </button>
            <ContextMenuOverlay
                contextMenu={contextMenu}
                presenter={props.presenter}
                onClose={handleCloseContextMenu}
            />
            <EndpointSelectorOverlay
                endpointSelector={endpointSelector}
                presenter={props.presenter}
                onClose={handleCloseEndpointSelector}
            />
        </div>
    );
});

interface TabCloseButtonProps {
    isRegistered: boolean;
    tabId: string;
    onClose: (ev: React.MouseEvent, id: string) => void;
}

/* Only renders the close button for user tabs. */
const TabCloseButton = (props: TabCloseButtonProps) => {
    if (props.isRegistered) {
        return null;
    }

    return (
        <button
            className="ml-1 p-0.5 rounded hover:bg-neutral-dimmed"
            onClick={ev => props.onClose(ev, props.tabId)}
            title="Close tab"
        >
            <CloseIcon className="w-3 h-3 text-neutral-dimmed" />
        </button>
    );
};

interface ContextMenuOverlayProps {
    contextMenu: ContextMenuState | null;
    presenter: PlaygroundPresenter.Interface;
    onClose: () => void;
}

/* Renders the context menu when right-clicking a tab. */
const ContextMenuOverlay = (props: ContextMenuOverlayProps) => {
    if (!props.contextMenu) {
        return null;
    }

    return (
        <TabContextMenu
            presenter={props.presenter}
            tabId={props.contextMenu.tabId}
            isRegistered={props.contextMenu.isRegistered}
            x={props.contextMenu.x}
            y={props.contextMenu.y}
            onClose={props.onClose}
        />
    );
};

interface EndpointSelectorOverlayProps {
    endpointSelector: EndpointSelectorState | null;
    presenter: PlaygroundPresenter.Interface;
    onClose: () => void;
}

/* Renders the endpoint selector dropdown when clicking "+". */
const EndpointSelectorOverlay = (props: EndpointSelectorOverlayProps) => {
    if (!props.endpointSelector) {
        return null;
    }

    return (
        <EndpointSelector
            presenter={props.presenter}
            x={props.endpointSelector.x}
            y={props.endpointSelector.y}
            onClose={props.onClose}
        />
    );
};
