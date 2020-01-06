// @flow
import React, { useCallback, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPlugins } from "@webiny/plugins";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { set } from "dot-prop-immutable";
import { get, isEqual } from "lodash";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import IconPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/IconPicker";

const ButtonSettings = React.memo(({ element, updateElement }: Object) => {
    const { theme } = usePageBuilder();
    const { types } = get(theme, "elements.button", []);
    const { type = get(types, "0.name", ""), icon = {} } = get(element, "data", {});

    const setData = useMemo(() => {
        const historyUpdated = {};

        return (name, value, history = true) => {
            const attrKey = `data.${name}`;

            let newElement = set(element, attrKey, value);
            if (name.startsWith("icon")) {
                const { id, width, color } = get(newElement, "data.icon");
                newElement = set(newElement, "data.icon.svg", getSvg(id, { width, color }));
            }

            if (!history) {
                updateElement({ element: newElement, history });
                return;
            }

            if (historyUpdated[name] !== value) {
                historyUpdated[name] = value;
                updateElement({ element: newElement });
            }
        };
    }, [element, updateElement]);

    const updateType = useCallback((value: Object) => setData("type", value), [setData]);
    const updateIcon = useCallback((value: Object) => setData("icon.id", value.id), [setData]);
    const updateIconColor = useCallback((value: string) => setData("icon.color", value), [setData]);
    const updateIconColorPreview = useCallback(
        (value: string) => setData("icon.color", value, false),
        [setData]
    );
    const updateIconWidth = useCallback((value: string) => setData("icon.width", value), [setData]);
    const updateIconPosition = useCallback((value: string) => setData("icon.position", value), [
        setData
    ]);

    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Button"}>
                    <Grid>
                        <Cell span={6}>
                            <Typography use={"overline"}>Type</Typography>
                        </Cell>
                        <Cell span={6}>
                            <Select value={type} onChange={updateType}>
                                {types.map(type => (
                                    <option key={type.className} value={type.className}>
                                        {type.label}
                                    </option>
                                ))}
                            </Select>
                        </Cell>
                    </Grid>
                </Tab>
                <Tab label={"Icon"}>
                    <IconPicker label={"Icon"} value={icon.id} updateValue={updateIcon} />
                    <Input label={"Width"} value={icon.width || 50} updateValue={updateIconWidth} />
                    <ColorPicker
                        label={"Color"}
                        value={icon.color}
                        updateValue={updateIconColor}
                        updatePreview={updateIconColorPreview}
                    />
                    <Grid>
                        <Cell span={6}>
                            <Typography use={"overline"}>Position</Typography>
                        </Cell>
                        <Cell span={6}>
                            <Select value={icon.position || "left"} onChange={updateIconPosition}>
                                <option value={"left"}>Left</option>
                                <option value={"right"}>Right</option>
                                <option value={"top"}>Top</option>
                                <option value={"bottom"}>Bottom</option>
                            </Select>
                        </Cell>
                    </Grid>
                </Tab>
            </Tabs>
        </React.Fragment>
    );
});

let icons;
const getIcons = () => {
    if (!icons) {
        icons = getPlugins("pb-icons").reduce((icons: Array<Object>, pl: Object) => {
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

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(ButtonSettings);
