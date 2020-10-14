import React, { useCallback, useMemo } from "react";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import IconPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/IconPicker";
import { updateElementAction } from "@webiny/app-page-builder/editor/recoil/actions/updateElement";
import { editorUiActiveElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/recoil";
import { renderToStaticMarkup } from "react-dom/server";
import { getPlugins } from "@webiny/plugins";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { PbElement, PbIcon, PbIconsPlugin } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

// TODO check is it possible to dynamically add icons?
// if yes, this wont work
let icons;
const getIcons = (): PbIcon[] => {
    if (!icons) {
        const plugins = getPlugins<PbIconsPlugin>("pb-icons");
        icons = plugins.reduce((icons, pl) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

const getSvg = (id: string[], props: any = {}) => {
    if (!props.width) {
        props.width = 50;
    }
    const icon: PbIcon = getIcons().find(ic => ic.id[0] === id[0] && ic.id[1] === id[1]);
    if (!icon) {
        return null;
    }
    return renderToStaticMarkup(React.cloneElement(icon.svg, props));
};

type BuildElementResultType = {
    element: PbElement;
    name: string;
    value: string;
};
const buildElementWithIconData = (
    element: PbElement,
    propertyName: string,
    value: string
): BuildElementResultType => {
    const icon = {
        ...(element.data.icon || {}),
        [propertyName]: value
    };
    const { id: iconId, width, color } = icon;
    const iconSvg = getSvg(iconId, { width, color });
    const newElement = {
        ...element,
        data: {
            ...(element.data || {}),
            icon: {
                ...icon,
                svg: iconSvg
            }
        }
    };
    return {
        element: newElement,
        name: propertyName,
        value: value
    };
};

const buildElementWithType = (element: PbElement, value: string): BuildElementResultType => {
    const newElement = {
        ...element,
        data: {
            ...element.data,
            type: value
        }
    };
    return {
        element: newElement,
        name: "type",
        value
    };
};

type SetDataFunctionValuesType = {
    element: PbElement;
    name: string;
    value: string;
};
type SetDataFunctionType = (values: SetDataFunctionValuesType, history?: boolean) => void;

const ButtonSettings = () => {
    const element = useRecoilValue(editorUiActiveElementWithChildrenSelector);
    const { theme } = usePageBuilder();
    const { types } = theme?.elements?.button || [];
    const defaultType = types?.[0]?.name || "";
    const { type = defaultType, icon = {} } = element.data || {};

    const setData: SetDataFunctionType = useMemo(() => {
        const historyUpdated = {};

        return ({ element: newElement, name, value }, history = true) => {
            if (!history) {
                updateElementAction({ element: newElement, history });
                return;
            }

            if (historyUpdated[name] !== value) {
                historyUpdated[name] = value;
                updateElementAction({ element: newElement });
            }
        };
    }, [element.id]);

    const updateType = useCallback(
        (value: string) => setData(buildElementWithType(element, value)),
        [element.id]
    );
    const updateIcon = useCallback(
        (value: { id: string }) => setData(buildElementWithIconData(element, "id", value.id)),
        [element.id]
    );
    const updateIconColor = useCallback(
        (value: string) => setData(buildElementWithIconData(element, "color", value)),
        [element.id]
    );
    const updateIconColorPreview = useCallback(
        (value: string) => setData(buildElementWithIconData(element, "color", value), false),
        [element.id]
    );
    const updateIconWidth = useCallback(
        (value: string) => setData(buildElementWithIconData(element, "width", value)),
        [element.id]
    );
    const updateIconPosition = useCallback(
        (value: string) => setData(buildElementWithIconData(element, "position", value)),
        [element.id]
    );

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
};

export default ButtonSettings;
