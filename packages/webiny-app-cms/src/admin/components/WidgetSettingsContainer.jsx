import React from "react";
import { createComponent } from "webiny-app";

class WidgetSettingsContainer extends React.Component {
    getRenderProps = () => {
        const {
            widget,
            onChange,
            Bind,
            modules: { Accordion }
        } = this.props;
        return {
            Group: Accordion.Item,
            widgetProps: {
                widget,
                onChange,
                Bind
            },
            settingsGroup: element => {
                return (
                    <Accordion.Item icon="cog" title={"Settings"}>
                        {element}
                    </Accordion.Item>
                );
            },
            cssGroup: element => {
                if (!element) {
                    element = "Default CSS settings";
                }

                return (
                    <Accordion.Item icon={"sliders-h"} title={"CSS"}>
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

export default createComponent(WidgetSettingsContainer, { modules: ["Accordion"] });
