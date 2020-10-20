import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import React, { useCallback, useMemo } from "react";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import IconPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/IconPicker";
import { renderToStaticMarkup } from "react-dom/server";
import { plugins } from "@webiny/plugins";
import { set } from "dot-prop-immutable";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { PbIcon, PbIconsPlugin } from "@webiny/app-page-builder/types";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilValue } from "recoil";

// TODO check is it possible to dynamically add icons?
// if yes, this wont work
let icons;
const getIcons = (): PbIcon[] => {
    if (!icons) {
        const pluginsByType = plugins.byType<PbIconsPlugin>("pb-icons");
        icons = pluginsByType.reduce((icons, pl) => {
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

const ButtonSettings = () => {
    const eventActionHandler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { theme } = usePageBuilder();
    const { types } = theme?.elements?.button || [];
    const defaultType = types?.[0]?.name || "";
    const { type = defaultType, icon = {} } = element.data || {};

    const setData = useMemo(() => {
        const historyUpdated = {};

        return (name, value, history = true) => {
            const attrKey = `data.${name}`;

            const newElement = set(element, attrKey, value);
            const isIcon = name.startsWith("icon");
            if (isIcon) {
                const { id, width, color } = newElement.data?.icon || {};

                const isSelectedIcon =
                    icon.id && id ? icon.id[0] === id[0] && icon.id[1] === id[1] : false;

                const updatedIcon = isSelectedIcon ? {} : newElement.data.icon || {};

                newElement.data.icon = {
                    ...updatedIcon,
                    svg: id && !isSelectedIcon ? getSvg(id, { width, color }) : undefined
                };
            }

            if (!history) {
                eventActionHandler.trigger(
                    new UpdateElementActionEvent({
                        element: newElement,
                        history
                    })
                );
                return;
            }

            if (historyUpdated[name] !== value || (value === undefined && isIcon)) {
                historyUpdated[name] = value;
                eventActionHandler.trigger(
                    new UpdateElementActionEvent({
                        element: newElement
                    })
                );
            }
        };
    }, [element.id]);

    const updateType = useCallback(value => setData("type", value), [setData]);
    const updateIcon = useCallback(value => setData("icon.id", value?.id), [setData]);
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
        <>
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
                    <IconPicker label={"Icon"} value={icon?.id} updateValue={updateIcon} />
                    <Input
                        label={"Width"}
                        value={icon?.width || 50}
                        updateValue={updateIconWidth}
                    />
                    <ColorPicker
                        label={"Color"}
                        value={icon?.color}
                        updateValue={updateIconColor}
                        updatePreview={updateIconColorPreview}
                    />
                    <Grid>
                        <Cell span={6}>
                            <Typography use={"overline"}>Position</Typography>
                        </Cell>
                        <Cell span={6}>
                            <Select value={icon?.position || "left"} onChange={updateIconPosition}>
                                <option value={"left"}>Left</option>
                                <option value={"right"}>Right</option>
                                <option value={"top"}>Top</option>
                                <option value={"bottom"}>Bottom</option>
                            </Select>
                        </Cell>
                    </Grid>
                </Tab>
            </Tabs>
        </>
    );
};

export default ButtonSettings;
