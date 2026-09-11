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

export const EndpointSelector = observer((props: EndpointSelectorProps) => {
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
                props.onClose();
            },
            { signal: controller.signal }
        );

        return () => {
            controller.abort();
        };
    }, [props.onClose]);

    const handleSelect = useCallback(
        (definitionId: string) => {
            props.presenter.createTab(definitionId);
            props.onClose();
        },
        [props.presenter, props.onClose]
    );

    const endpoints = props.presenter.vm.endpoints;

    useEffect(() => {
        const element = menuRef.current;
        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            element.style.left = `${window.innerWidth - rect.width - 8}px`;
        }
    }, [props.x, props.y]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-neutral-elevated border border-neutral-dimmed rounded shadow-lg py-1 min-w-48"
            style={{ left: props.x, top: props.y }}
        >
            <div className="px-3 py-1.5 text-xs text-neutral-muted font-medium">New tab for:</div>
            {endpoints.map(ep => {
                return (
                    <button
                        key={ep.definitionId}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-light"
                        onClick={() => handleSelect(ep.definitionId)}
                    >
                        <div className="font-medium">{ep.name}</div>
                        <div className="text-xs text-neutral-dimmed truncate">{ep.endpoint}</div>
                    </button>
                );
            })}
        </div>
    );
});
