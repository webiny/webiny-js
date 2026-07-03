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

export const TabBar: React.FC<TabBarProps> = observer(function TabBar({ presenter }) {
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [endpointSelector, setEndpointSelector] = useState<EndpointSelectorState | null>(null);
    const vm = presenter.vm;

    const handleTabClick = useCallback(
        (id: string) => {
            presenter.selectTab(id);
        },
        [presenter]
    );

    const handleCloseTab = useCallback(
        (ev: React.MouseEvent, id: string) => {
            ev.stopPropagation();
            presenter.closeTab(id);
        },
        [presenter]
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
        <div className="flex items-center bg-gray-50 border-b border-gray-200 overflow-x-auto">
            {vm.tabs.map(tab => {
                const isActive = tab.id === vm.activeTabId;

                return (
                    <div
                        key={tab.id}
                        className={`flex items-center gap-1 px-3 py-2 cursor-pointer border-r border-gray-200 min-w-0 shrink-0 ${
                            isActive ? "bg-white border-b-2 border-b-blue-500" : "hover:bg-gray-100"
                        }`}
                        onClick={() => handleTabClick(tab.id)}
                        onContextMenu={ev => handleContextMenu(ev, tab.id, tab.isRegistered)}
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{tab.name}</span>
                            <span className="text-[10px] text-gray-400 truncate max-w-32">
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
                className="flex items-center justify-center px-2 py-2 hover:bg-gray-100 shrink-0"
                onClick={handleAddClick}
                title="New tab"
            >
                <AddIcon className="w-4 h-4 text-gray-500" />
            </button>
            <ContextMenuOverlay
                contextMenu={contextMenu}
                presenter={presenter}
                onClose={handleCloseContextMenu}
            />
            <EndpointSelectorOverlay
                endpointSelector={endpointSelector}
                presenter={presenter}
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
const TabCloseButton: React.FC<TabCloseButtonProps> = function TabCloseButton({
    isRegistered,
    tabId,
    onClose
}) {
    if (isRegistered) {
        return null;
    }

    return (
        <button
            className="ml-1 p-0.5 rounded hover:bg-gray-200"
            onClick={ev => onClose(ev, tabId)}
            title="Close tab"
        >
            <CloseIcon className="w-3 h-3 text-gray-400" />
        </button>
    );
};

interface ContextMenuOverlayProps {
    contextMenu: ContextMenuState | null;
    presenter: PlaygroundPresenter.Interface;
    onClose: () => void;
}

/* Renders the context menu when right-clicking a tab. */
const ContextMenuOverlay: React.FC<ContextMenuOverlayProps> = function ContextMenuOverlay({
    contextMenu,
    presenter,
    onClose
}) {
    if (!contextMenu) {
        return null;
    }

    return (
        <TabContextMenu
            presenter={presenter}
            tabId={contextMenu.tabId}
            isRegistered={contextMenu.isRegistered}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={onClose}
        />
    );
};

interface EndpointSelectorOverlayProps {
    endpointSelector: EndpointSelectorState | null;
    presenter: PlaygroundPresenter.Interface;
    onClose: () => void;
}

/* Renders the endpoint selector dropdown when clicking "+". */
const EndpointSelectorOverlay: React.FC<EndpointSelectorOverlayProps> =
    function EndpointSelectorOverlay({ endpointSelector, presenter, onClose }) {
        if (!endpointSelector) {
            return null;
        }

        return (
            <EndpointSelector
                presenter={presenter}
                x={endpointSelector.x}
                y={endpointSelector.y}
                onClose={onClose}
            />
        );
    };
