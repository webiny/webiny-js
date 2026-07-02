import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import type { PlaygroundPresenter } from "../abstractions.js";

interface TabContextMenuProps {
    presenter: PlaygroundPresenter.Interface;
    tabId: string;
    isRegistered: boolean;
    x: number;
    y: number;
    onClose: () => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = function TabContextMenu({
    presenter,
    tabId,
    isRegistered,
    x,
    y,
    onClose
}) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleDuplicate = useCallback(() => {
        presenter.duplicateTab(tabId);
        onClose();
    }, [presenter, tabId, onClose]);

    const handleStartRename = useCallback(() => {
        const tab = presenter.vm.tabs.find(t => t.id === tabId);
        if (!tab) {
            return;
        }

        setRenameValue(tab.name);
        setIsRenaming(true);
    }, [presenter, tabId]);

    const handleConfirmRename = useCallback(() => {
        const trimmed = renameValue.trim();
        if (trimmed) {
            presenter.renameTab(tabId, trimmed);
        }
        onClose();
    }, [presenter, tabId, renameValue, onClose]);

    const handleRenameKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleConfirmRename();
            }
            if (e.key === "Escape") {
                onClose();
            }
        },
        [handleConfirmRename, onClose]
    );

    if (isRenaming) {
        return (
            <div
                ref={menuRef}
                className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg p-2"
                style={{ left: x, top: y }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleConfirmRename}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-40"
                />
            </div>
        );
    }

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-32"
            style={{ left: x, top: y }}
        >
            <button
                className="w-full px-4 py-1.5 text-left text-sm hover:bg-gray-100"
                onClick={handleDuplicate}
            >
                Duplicate
            </button>
            <RenameButton isRegistered={isRegistered} onStartRename={handleStartRename} />
        </div>
    );
};

interface RenameButtonProps {
    isRegistered: boolean;
    onStartRename: () => void;
}

/* Only renders the rename option for user tabs. */
const RenameButton: React.FC<RenameButtonProps> = function RenameButton({
    isRegistered,
    onStartRename
}) {
    if (isRegistered) {
        return null;
    }

    return (
        <button
            className="w-full px-4 py-1.5 text-left text-sm hover:bg-gray-100"
            onClick={onStartRename}
        >
            Rename
        </button>
    );
};
