import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { observer } from "mobx-react-lite";
import type { PlaygroundPresenter } from "../abstractions.js";

interface EndpointSelectorProps {
    presenter: PlaygroundPresenter.Interface;
    x: number;
    y: number;
    onClose: () => void;
}

export const EndpointSelector: React.FC<EndpointSelectorProps> = observer(
    function EndpointSelector({ presenter, x, y, onClose }) {
        const menuRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const controller = new AbortController();

            document.addEventListener(
                "mousedown",
                ev => {
                    if (!menuRef.current) {
                        return;
                    } else if (menuRef.current.contains(ev.target as Node)) {
                        return;
                    }
                    onClose();
                },
                { signal: controller.signal }
            );

            return () => {
                controller.abort();
            };
        }, [onClose]);

        const handleSelect = useCallback(
            (definitionId: string) => {
                presenter.createTab(definitionId);
                onClose();
            },
            [presenter, onClose]
        );

        const endpoints = presenter.vm.endpoints;

        useEffect(() => {
            const element = menuRef.current;
            if (!element) {
                return;
            }

            const rect = element.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                element.style.left = `${window.innerWidth - rect.width - 8}px`;
            }
        }, [x, y]);

        return (
            <div
                ref={menuRef}
                className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-48"
                style={{ left: x, top: y }}
            >
                <div className="px-3 py-1.5 text-xs text-gray-500 font-medium">New tab for:</div>
                {endpoints.map(ep => {
                    return (
                        <button
                            key={ep.definitionId}
                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                            onClick={() => handleSelect(ep.definitionId)}
                        >
                            <div className="font-medium">{ep.name}</div>
                            <div className="text-xs text-gray-400 truncate">{ep.endpoint}</div>
                        </button>
                    );
                })}
            </div>
        );
    }
);
