import { isPluginActive } from "@webiny/app-page-builder/editor/recoil/modules/plugins/selectors/isPluginActiveSelector";
import React, { useEffect, useState } from "react";
import { pluginsAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { deactivatePluginMutation } from "@webiny/app-page-builder/editor/recoil/modules/plugins/mutations/deactivatePluginMutation";
import { Transition } from "react-transition-group";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { useRecoilState } from "recoil";

const Overlay = styled("div")({
    position: "fixed",
    top: 64,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 5
});

const defaultStyle = {
    transform: "translateY(-5px)",
    opacity: 0,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "cubic-bezier(0, 0, .2, 1)",
    transitionDuration: "250ms",
    willChange: "opacity, transform"
};

const transitionStyles = {
    entering: { opacity: 0, transform: "translateY(-5px)" },
    entered: { opacity: 1, transform: "translateY(0px)" }
};

const Wrapper = styled("div")({
    padding: 0,
    boxSizing: "border-box",
    ".mdc-tab-content": {
        padding: 15
    },
    ".mdc-layout-grid": {
        padding: 0,
        "&.no-bottom-padding": {
            paddingBottom: 0
        },
        ".mdc-layout-grid__inner": {
            gridGap: 0,
            '[class*="mdc-layout-grid__cell--span-"]': {
                display: "flex",
                alignItems: "center",
                color: "var(--mdc-theme-text-secondary-on-background)",
                marginBottom: 10,
                justifyContent: "flex-end",
                '[class*="mdc-typography--"], .mdc-button__icon': {
                    lineHeight: "120%",
                    width: "100%"
                },
                ".mdc-button__icon": {
                    marginRight: 20
                }
            }
        }
    }
});

const ToolbarBox = styled("div")(
    {
        position: "absolute",
        color: "var(--mdc-theme-on-surface)",
        zIndex: 6,
        width: 270,
        top: 56,
        left: 25,
        ".elevationBox": {
            backgroundColor: "var(--mdc-theme-surface)",
            borderRadius: 2,
            "&::after": {
                content: "''",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderBottom: "7px solid var(--mdc-theme-on-background)",
                position: "absolute",
                top: -7,
                left: "50%",
                transform: "translateX(-50%)"
            }
        }
    },
    (props: any) => ({
        left: props.left || 0
    })
);

const Menu = ({ plugin, options }) => {
    const ref = React.createRef<any>();
    const [moveLeft, setMoveLeft] = useState<number>(null);
    const [pluginsAtomValue, setPluginsAtomValue] = useRecoilState(pluginsAtom);
    const isActive = isPluginActive(pluginsAtomValue, plugin);

    const deactivateCurrentPlugin = () => {
        setPluginsAtomValue(prev => deactivatePluginMutation(prev, plugin));
    };

    useEffect(() => {
        if (moveLeft === null) {
            return;
        }
        window.dispatchEvent(new Event("resize"));
    }, [moveLeft]);

    useEffect(() => {
        if (!ref.current) {
            return;
        }
        setMoveLeft(-(ref.current.offsetWidth - 48) / 2);
    }, [plugin.name, options, isActive]);

    const content = plugin.renderMenu({ options });

    return (
        <Transition in={isActive} timeout={125} appear={true} unmountOnExit={true}>
            {state => (
                <React.Fragment>
                    <ToolbarBox
                        left={moveLeft}
                        style={{ ...defaultStyle, ...transitionStyles[state] }}
                    >
                        <Elevation z={2} className={"elevationBox"}>
                            <div ref={ref}>
                                <Wrapper>{content}</Wrapper>
                            </div>
                        </Elevation>
                    </ToolbarBox>
                    <Overlay onClick={deactivateCurrentPlugin} />
                </React.Fragment>
            )}
        </Transition>
    );
};

export default React.memo(Menu);
