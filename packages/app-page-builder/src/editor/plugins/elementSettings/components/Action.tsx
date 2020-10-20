import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { TogglePluginActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import React, { useEffect, useCallback, ReactElement } from "react";
import {
    isPluginActiveSelector,
    activePluginsByTypeTotalSelector,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useRecoilValue } from "recoil";

const editorPageElementSettingsPluginType = "pb-editor-page-element-settings";

const activeStyle = css({
    "&.mdc-icon-button": {
        color: "var(--mdc-theme-primary)"
    }
});

type ActionProps = {
    plugin?: string;
    icon?: ReactElement;
    tooltip?: string;
    onClick?: () => void;
    shortcut?: string[];
    // For testing purposes.
    "data-testid"?: string;
};

const Action = ({
    plugin,
    icon,
    tooltip,
    onClick,
    shortcut: shortcutProp,
    ...props
}: ActionProps) => {
    const eventActionHandler = useEventActionHandler();
    const isPluginActive = useRecoilValue(isPluginActiveSelector(plugin));
    const { slateFocused } = useRecoilValue(uiAtom);
    const settingsActive =
        useRecoilValue(activePluginsByTypeTotalSelector(editorPageElementSettingsPluginType)) > 0;

    const shortcut = typeof shortcutProp === "string" ? [shortcutProp] : shortcutProp || [];

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const clickHandler = useCallback(() => {
        if (typeof onClick === "function") {
            return onClick();
        }
        eventActionHandler.trigger(
            new TogglePluginActionEvent({
                name: plugin,
                closeOtherInGroup: true
            })
        );
    }, [plugin, onClick]);

    useEffect(() => {
        shortcut.map(short => {
            addKeyHandler(short, e => {
                if (slateFocused || settingsActive) {
                    return;
                }

                e.preventDefault();
                onClick();
            });
        });

        return () => {
            shortcut.map(short => {
                removeKeyHandler(short);
            });
        };
    }, []);

    return (
        <Tooltip
            placement={"bottom"}
            content={<span>{tooltip}</span>}
            {...(isPluginActive ? { visible: false } : {})}
        >
            <IconButton
                icon={icon}
                onClick={clickHandler}
                className={isPluginActive && activeStyle}
                data-testid={props["data-testid"]}
            />
        </Tooltip>
    );
};
export default React.memo(Action);
