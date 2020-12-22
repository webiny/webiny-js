import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementSettingsRenderComponentProps, PbThemePlugin } from "../../../../types";
import { activeElementWithChildrenSelector } from "../../../recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import SelectField from "../../elementSettings/components/SelectField";
import { BaseColorPicker } from "../../elementSettings/components/ColorPicker";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";

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
    })
};

const TextSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const [{ theme }] = plugins.byType<PbThemePlugin>("pb-theme");

    const {
        data: {
            text = {
                color: "",
                typography: "",
                type: "paragraph"
            }
        } = {}
    } = element;

    const themeTypographyOptions = useMemo(() => {
        return Object.values(theme.typography).map(el => (
            <option value={el.className} key={el.label}>
                {el.label}
            </option>
        ));
    }, [theme]);

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: "data.text"
    });

    const updateColor = useCallback((value: string) => getUpdateValue("color")(value), [
        getUpdateValue
    ]);
    const updateColorPreview = useCallback((value: string) => getUpdatePreview("color")(value), [
        getUpdatePreview
    ]);

    const updateTypography = useCallback((value: string) => getUpdateValue("typography")(value), [
        getUpdateValue
    ]);

    return (
        <Accordion title={"Text"} defaultValue={defaultAccordionValue}>
            <>
                <Wrapper containerClassName={classes.grid} label={"Color"}>
                    <BaseColorPicker
                        value={text.color}
                        updateValue={updateColor}
                        updatePreview={updateColorPreview}
                    />
                </Wrapper>
                <Wrapper containerClassName={classes.grid} label={"Typography"}>
                    <SelectField value={text.typography} onChange={updateTypography}>
                        {themeTypographyOptions}
                    </SelectField>
                </Wrapper>
            </>
        </Accordion>
    );
};

export default React.memo(TextSettings);
