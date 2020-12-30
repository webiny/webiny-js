import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin,
    PbThemePlugin
} from "../../../../types";
import { activeElementWithChildrenSelector, uiAtom } from "../../../recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import SelectField from "../../elementSettings/components/SelectField";
import { BaseColorPicker } from "../../elementSettings/components/ColorPicker";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import TextAlignment from "./TextAlignment";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    widthInputStyle: css({
        maxWidth: 60
    }),
    rightCellStyle: css({
        justifySelf: "end"
    }),
    leftCellStyle: css({
        alignSelf: "center"
    })
};

const DATA_NAMESPACE = "data.text";

const TextSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps & {
    options: any;
}> = ({ defaultAccordionValue, options }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const [{ theme }] = plugins.byType<PbThemePlugin>("pb-theme");

    const { config: activeDisplayModeConfig } = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const themeTypographyOptions = useMemo(() => {
        const { types } = theme.elements[element.type];
        return types.map(el => (
            <option value={el.className} key={el.label}>
                {el.label}
            </option>
        ));
    }, [theme]);

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const updateColor = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.color`)(value),
        [getUpdateValue, displayMode]
    );
    const updateColorPreview = useCallback(
        (value: string) => getUpdatePreview(`${displayMode}.color`)(value),
        [getUpdatePreview]
    );

    const updateTypography = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.typography`)(value),
        [getUpdateValue, displayMode]
    );

    const updateAlignment = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.alignment`)(value),
        [getUpdateValue, displayMode]
    );

    const updateTag = useCallback((value: string) => getUpdateValue(`${displayMode}.tag`)(value), [
        getUpdateValue,
        displayMode
    ]);

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const text = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

    return (
        <Accordion
            title={"Text"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
            <>
                <Wrapper containerClassName={classes.grid} label={"Color"}>
                    <BaseColorPicker
                        value={text.color}
                        updateValue={updateColor}
                        updatePreview={updateColorPreview}
                    />
                </Wrapper>
                {options.useCustomTag && (
                    <Wrapper
                        containerClassName={classes.grid}
                        label={"Heading Type"}
                        leftCellSpan={5}
                        rightCellSpan={7}
                    >
                        <SelectField value={text.tag} onChange={updateTag}>
                            {options.tags.map(tag => (
                                <option value={tag} key={tag}>
                                    {tag.toUpperCase()}
                                </option>
                            ))}
                        </SelectField>
                    </Wrapper>
                )}
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Typography"}
                    leftCellSpan={5}
                    rightCellSpan={7}
                >
                    <SelectField value={text.typography} onChange={updateTypography}>
                        {themeTypographyOptions}
                    </SelectField>
                </Wrapper>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Alignment"}
                    leftCellSpan={3}
                    rightCellSpan={9}
                    leftCellClassName={classes.leftCellStyle}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <TextAlignment value={text.alignment} onChange={updateAlignment} />
                </Wrapper>
            </>
        </Accordion>
    );
};

export default React.memo(TextSettings);
