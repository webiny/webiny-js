// @flow
import * as React from "react";
import { compose, withState, mapProps, lifecycle } from "recompose";
import { ButtonFloating } from "webiny-ui/Button";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import type { ElementPluginType } from "webiny-app-cms/types";

type Props = {
    onClick: ?Function,
    label: string,
    plugin: ElementPluginType,
    icon: React.Node
};

const ElementButton = ({ onClick, label, icon }: Props) => {
    return <ButtonFloating small onClick={onClick} label={label} icon={icon} />;
};

export default compose(
    withKeyHandler(),
    withState("shiftKey", "setShiftKey", false),
    lifecycle({
        componentDidMount() {
            this.props.addKeyHandler("shift", () => {
                this.props.setShiftKey(true);
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("shift");
        }
    }),
    mapProps(({ shiftKey, label, onClick, plugin, icon }) => {
        if (shiftKey && plugin.element.shiftButton) {
            return {
                ...plugin.element.shiftButton
            };
        }
        return { label, onClick, plugin, icon };
    })
)(ElementButton);
