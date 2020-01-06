//@flow
import React, { useEffect, useCallback } from "react";
import { css } from "emotion";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { togglePlugin } from "@webiny/app-page-builder/editor/actions";
import { IconButton } from "@webiny/ui/Button";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { getUi, getActivePlugins, isPluginActive } from "@webiny/app-page-builder/editor/selectors";
import { Tooltip } from "@webiny/ui/Tooltip";

const activeStyle = css({
    "&.mdc-icon-button": {
        color: "var(--mdc-theme-primary)"
    }
});

const Action = (props: Object) => {
    const { togglePlugin, plugin, icon, active, tooltip, onClick } = props;

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const clickHandler = useCallback(() => {
        if (typeof onClick === "function") {
            return onClick();
        }
        togglePlugin({ name: plugin, closeOtherInGroup: true });
    }, [plugin, onClick]);

    useEffect(() => {
        let { onClick, shortcut = [] } = props;
        if (typeof shortcut === "string") {
            shortcut = [shortcut];
        }

        shortcut.map(short => {
            addKeyHandler(short, e => {
                const { slateFocused, settingsActive } = props;
                if (slateFocused || settingsActive) {
                    return;
                }

                e.preventDefault();
                onClick();
            });
        });

        return () => {
            let { shortcut = [] } = props;

            if (typeof shortcut === "string") {
                shortcut = [shortcut];
            }

            shortcut.map(short => {
                removeKeyHandler(short);
            });
        };
    });

    return (
        <Tooltip
            placement={"bottom"}
            content={<span>{tooltip}</span>}
            {...(active ? { visible: false } : {})}
        >
            <IconButton icon={icon} onClick={clickHandler} className={active && activeStyle} />
        </Tooltip>
    );
};

export default connect(
    (state, props) => ({
        active: isPluginActive(props.plugin)(state),
        // $FlowFixMe
        slateFocused: getUi(state).slateFocused,
        settingsActive: getActivePlugins("pb-page-element-settings")(state).length > 0
    }),
    { togglePlugin }
)(Action);
