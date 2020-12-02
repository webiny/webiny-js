import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import { BaseIconPicker } from "../../elementSettings/components/IconPicker";
import { BaseColorPicker } from "../../elementSettings/components/ColorPicker";
import { ContentWrapper } from "../../elementSettings/components/StyledComponents";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import SelectField from "../../elementSettings/components/SelectField";
import { updateButtonElementIcon } from "../utils/iconUtils";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";

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

const ButtonSettings = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { theme } = usePageBuilder();
    const { types } = theme?.elements?.button || [];
    const defaultType = types?.[0]?.name || "";
    const { type = defaultType, icon = { width: 36 } } = element.data || {};

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: "data",
        postModifyElement: updateButtonElementIcon
    });

    const updateType = useCallback(value => getUpdateValue("type")(value), [getUpdateValue]);
    const updateIcon = useCallback(value => getUpdateValue("icon.id")(value?.id), [getUpdateValue]);
    const updateIconColor = useCallback((value: string) => getUpdateValue("icon.color")(value), [
        getUpdateValue
    ]);
    const updateIconColorPreview = useCallback(
        (value: string) => getUpdatePreview("icon.color")(value),
        [getUpdatePreview]
    );
    const updateIconWidth = useCallback((value: string) => getUpdateValue("icon.width")(value), [
        getUpdateValue
    ]);
    const updateIconPosition = useCallback(
        (value: string) => getUpdateValue("icon.position")(value),
        [getUpdateValue]
    );

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
                        value={icon?.width}
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
