import React, { useCallback, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { set } from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { plugins } from "@webiny/plugins";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { PbElement, PbIcon, PbIconsPlugin } from "@webiny/app-page-builder/types";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import { BaseIconPicker } from "../../elementSettings/components/IconPicker";
import { BaseColorPicker } from "../../elementSettings/components/ColorPicker";
import { ContentWrapper } from "../../elementSettings/components/StyledComponents";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import SelectField from "../../elementSettings/components/SelectField";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            margin: 0,
            marginBottom: 24
        }
    }),
    row: css({
        display: "flex",
        "& > div": {
            width: "50%",
            background: "beige"
        },

        "& .icon-picker-handler": {
            width: "100%",
            backgroundColor: "var(--webiny-theme-color-background)",
            "& svg": {
                width: 24,
                height: 24
            }
        },
        "& .color-picker-handler": {
            width: "100%",
            backgroundColor: "var(--webiny-theme-color-background)",
            "& > div": {
                width: "100%"
            }
        }
    })
};

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

            const newElement = set(element, attrKey, value) as PbElement;
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
        <Accordion title={"Button"}>
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Type"} containerClassName={classes.gridClass}>
                    <SelectField value={type} onChange={updateType}>
                        {types.map(type => (
                            <option key={type.className} value={type.className}>
                                {type.label}
                            </option>
                        ))}
                    </SelectField>
                </Wrapper>
                <Wrapper label={"Icon"} containerClassName={classes.gridClass}>
                    <BaseIconPicker
                        handlerClassName={"icon-picker-handler"}
                        value={icon?.id}
                        updateValue={updateIcon}
                    />
                </Wrapper>
                <Wrapper label={"Color"} containerClassName={classes.gridClass}>
                    <BaseColorPicker
                        handlerClassName={"color-picker-handler"}
                        value={icon?.color}
                        updateValue={updateIconColor}
                        updatePreview={updateIconColorPreview}
                    />
                </Wrapper>
                <Wrapper label={"Width"} containerClassName={classes.gridClass}>
                    <InputField
                        placeholder={"Width"}
                        value={icon?.width || 50}
                        onChange={updateIconWidth}
                    />
                </Wrapper>
                <Wrapper label={"Position"} containerClassName={classes.gridClass}>
                    <SelectField value={icon?.position || "left"} onChange={updateIconPosition}>
                        <option value={"left"}>Left</option>
                        <option value={"right"}>Right</option>
                        <option value={"top"}>Top</option>
                        <option value={"bottom"}>Bottom</option>
                    </SelectField>
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};

export default ButtonSettings;
