//@flow
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { isEqual } from "lodash";
import { getPlugins } from "webiny-plugins";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Grid } from "webiny-ui/Grid";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import Input from "webiny-app-cms/editor/plugins/elementSettings/components/Input";
import ColorPicker from "webiny-app-cms/editor/plugins/elementSettings/components/ColorPicker";
import IconPicker from "./IconPicker";

type Props = {
    element: Object,
    updateIcon: Function,
    updateWidth: Function,
    updateColor: Function,
    updateColorPreview: Function
};

const IconSettings = (props: Props) => {
    const { element, updateIcon, updateWidth, updateColor, updateColorPreview } = props;
    const { settings: { advanced: { icon = {} } = {} } = {} } = element;

    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Icon"}>
                    <Grid>
                        <IconPicker label={"Icon"} value={icon.id} updateValue={updateIcon} />
                        <Input label={"Width"} value={icon.width || 50} updateValue={updateWidth} />
                        <ColorPicker
                            label={"Color"}
                            value={icon.color}
                            updateValue={updateColor}
                            updatePreview={updateColorPreview}
                        />
                    </Grid>
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

let icons;
const getIcons = () => {
    if (!icons) {
        icons = getPlugins("cms-icons").reduce((icons: Array<Object>, pl: Object) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

const getSvg = (id: Array<string>, props: Object) => {
    if (!props.width) {
        props.width = 50;
    }
    const icon = getIcons().find(ic => isEqual(ic.id, id));
    if (!icon) {
        return null;
    }
    return renderToStaticMarkup(React.cloneElement(icon.svg, props));
};

export default compose(
    connect(
        state => ({ element: getActiveElement(state) }),
        { updateElement }
    ),
    withHandlers({
        updateSettings: ({ updateElement, element }) => {
            const historyUpdated = {};

            return (name, value, history = true) => {
                const attrKey = `settings.advanced.icon.${name}`;

                let newElement = set(element, attrKey, value);
                const { id, width, color } = get(newElement, "settings.advanced.icon");
                newElement = set(newElement, "data.icon", getSvg(id, { width, color }));

                if (!history) {
                    updateElement({ element: newElement, history });
                    return;
                }

                if (historyUpdated[name] !== value) {
                    historyUpdated[name] = value;
                    updateElement({ element: newElement });
                }
            };
        }
    }),
    withHandlers({
        updateIcon: ({ updateSettings }) => (value: Object) => updateSettings("id", value.id),
        updateColor: ({ updateSettings }) => (value: string) => updateSettings("color", value),
        updateColorPreview: ({ updateSettings }) => (value: string) =>
            updateSettings("color", value, false),
        updateWidth: ({ updateSettings }) => (value: string) => updateSettings("width", value)
    })
)(IconSettings);
