import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
// Components
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { ICON_PICKER_SIZE } from "@webiny/app-admin/components/IconPicker/types";
import Accordion from "../../elementSettings/components/Accordion";
import { ContentWrapper } from "../../elementSettings/components/StyledComponents";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import SelectField from "../../elementSettings/components/SelectField";
import { updateButtonElementIcon } from "../utils/iconUtils";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import startCase from "lodash/startCase";

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
    }),
    rightCellStyle: css({
        justifySelf: "end"
    })
};

const ButtonSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as PbEditorElement;

    let typesOptions: Array<{ value: string; label: string }> = [];

    const { theme } = usePageElements();
    const types = Object.keys(theme.styles?.button || {});
    typesOptions = types.map(item => ({
        value: item,
        label: startCase(item)
    }));

    const defaultType = typesOptions[0].value;
    const { type = defaultType, icon = { width: 36 } } = element.data || {};

    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data",
        postModifyElement: updateButtonElementIcon
    });

    const updateType = useCallback(value => getUpdateValue("type")(value), [getUpdateValue]);
    const updateIcon = useCallback(value => getUpdateValue("icon.value")(value), [getUpdateValue]);
    const updateIconWidth = useCallback(
        (value: string) => getUpdateValue("icon.width")(value),
        [getUpdateValue]
    );
    const updateIconPosition = useCallback(
        (value: string) => getUpdateValue("icon.position")(value),
        [getUpdateValue]
    );

    return (
        <Accordion title={"Button"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Type"} containerClassName={classes.gridClass}>
                    <SelectField value={type} onChange={updateType}>
                        {typesOptions.map(t => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </SelectField>
                </Wrapper>
                <Wrapper label={"Icon"} containerClassName={classes.gridClass}>
                    <IconPicker
                        size={ICON_PICKER_SIZE.SMALL}
                        value={icon?.value}
                        onChange={updateIcon}
                        removable
                    />
                </Wrapper>
                <Wrapper
                    label={"Icon width"}
                    containerClassName={classes.gridClass}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField
                        placeholder={"Width"}
                        value={icon?.width}
                        onChange={updateIconWidth}
                    />
                </Wrapper>
                <Wrapper
                    label={"Icon position"}
                    containerClassName={classes.gridClass}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
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
