import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { TogglePluginActionEvent } from "../../../recoil/actions";
import React, { useEffect, useCallback, ReactElement } from "react";
import { isPluginActiveSelector, activePluginsByTypeTotalSelector } from "../../../recoil/modules";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useKeyHandler } from "../../../hooks/useKeyHandler";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useRecoilValue } from "recoil";

const editorPageElementSettingsPluginType = "pb-editor-page-element-settings";

const activeStyle = css({
    "&.mdc-icon-button": {
        color: "var(--mdc-theme-primary)"
    }
});

interface ActionProps {
    disabled?: boolean;
    plugin?: string;
    icon?: ReactElement;
    tooltip?: string;
    onClick?: () => void;
    shortcut?: string[];
    // For testing purposes.
    "data-testid"?: string;
}

const Action = ({
    plugin,
    icon,
    tooltip,
    onClick,
    shortcut = [],
    disabled = false,
    ...props
}: ActionProps) => {
    const eventActionHandler = useEventActionHandler();
    const isPluginActive = useRecoilValue(isPluginActiveSelector(plugin as string));
    const settingsActive =
        useRecoilValue(activePluginsByTypeTotalSelector(editorPageElementSettingsPluginType)) > 0;

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const clickHandler = useCallback((): void => {
        if (typeof onClick === "function") {
            return onClick();
        }
        eventActionHandler.trigger(
            new TogglePluginActionEvent({
                name: plugin || "unknown",
                closeOtherInGroup: true
            })
        );
    }, [plugin, onClick]);

    useEffect((): (() => void) => {
        shortcut.map(short => {
            addKeyHandler(short, e => {
                if (settingsActive) {
                    return;
                }

                e.preventDefault();
                if (!onClick) {
                    return;
                }
                onClick();
            });
        });

        return () => {
            shortcut.map(short => {
                removeKeyHandler(short);
            });
        };
    }, [onClick]);

    return (
        <Tooltip
            placement={"bottom"}
            content={<span>{tooltip}</span>}
            {...(isPluginActive ? { visible: false } : {})}
        >
            <IconButton
                disabled={disabled}
                icon={icon}
                onClick={clickHandler}
                className={isPluginActive ? activeStyle : ""}
                data-testid={props["data-testid"]}
            />
        </Tooltip>
    );
};

export default Action;
