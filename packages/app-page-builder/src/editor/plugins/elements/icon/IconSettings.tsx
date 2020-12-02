import React, { useCallback } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import { BaseColorPicker } from "../../elementSettings/components/ColorPicker";
import { BaseIconPicker } from "../../elementSettings/components/IconPicker";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import { updateIconElement } from "../button/buttonSettingsUtils";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

const IconSettings = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { data: { icon = {} } = {} } = element;

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: "data.icon",
        postModifyElement: updateIconElement
    });

    const updateIcon = useCallback(value => getUpdateValue("id")(value?.id), [getUpdateValue]);
    const updateColor = useCallback((value: string) => getUpdateValue("color")(value), [
        getUpdateValue
    ]);
    const updateColorPreview = useCallback((value: string) => getUpdatePreview("color")(value), [
        getUpdatePreview
    ]);
    const updateWidth = useCallback((value: string) => getUpdateValue("width")(value), [
        getUpdateValue
    ]);

    return (
        <Accordion title={"Icon"}>
            <>
                <Wrapper containerClassName={classes.grid} label={"Icon"}>
                    <BaseIconPicker value={icon.id} updateValue={updateIcon} removable={false} />
                </Wrapper>

                <Wrapper containerClassName={classes.grid} label={"Color"}>
                    <BaseColorPicker
                        value={icon.color}
                        updateValue={updateColor}
                        updatePreview={updateColorPreview}
                    />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Width"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField value={icon.width} onChange={updateWidth} placeholder="50" />
                </Wrapper>
            </>
        </Accordion>
    );
};

export default React.memo(IconSettings);
