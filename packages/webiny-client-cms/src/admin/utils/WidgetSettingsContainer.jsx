import React from "react";
import { Component } from "webiny-client";
import WidgetStyle from "./SettingsGroup/WidgetStyle";
import WidgetPreset from "./SettingsGroup/WidgetPreset";

@Component({ modules: ["Accordion"] })
export default class WidgetSettingsContainer extends React.Component {
    getRenderProps = () => {
        const {
            widget,
            onChange,
            Bind,
            modules: { Accordion }
        } = this.props;

        const widgetProps = {
            widget,
            onChange,
            Bind
        };

        return {
            Group: Accordion.Item,
            widgetProps,
            settingsGroup: element => {
                return (
                    <Accordion.Item icon="cog" title={"Settings"}>
                        {element}
                    </Accordion.Item>
                );
            },
            styleGroup: element => {
                return (
                    <Accordion.Item icon={"sliders-h"} title={"Style"}>
                        <WidgetStyle {...widgetProps} />
                        {element}
                    </Accordion.Item>
                );
            },
            presetGroup: element => {
                return (
                    <Accordion.Item icon="save" title={"Preset"}>
                        <WidgetPreset {...widgetProps} />
                        {element}
                    </Accordion.Item>
                );
            }
        };
    };

    render() {
        const {
            children,
            modules: { Accordion }
        } = this.props;

        return (
            <Accordion>
                {children(this.getRenderProps()).map((item, index) =>
                    React.cloneElement(item, { key: index })
                )}
            </Accordion>
        );
    }
}
