import React, { useCallback } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps, PbIcon } from "~/types";
// Components
import IconPicker from "../../../components/IconPicker";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import { BaseColorPicker } from "../../elementSettings/components/ColorPicker";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import { updateIconElement } from "../utils/iconUtils";
import { activeElementAtom, elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

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

const IconSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as PbEditorElement;
    const { data: { icon = {} } = {} } = element;

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: "data.icon",
        postModifyElement: updateIconElement
    });

    const updateIcon = useCallback(
        (value: PbIcon) => getUpdateValue("id")(value?.id),
        [getUpdateValue]
    );
    const updateColor = useCallback(
        (value: string) => getUpdateValue("color")(value),
        [getUpdateValue]
    );
    const updateColorPreview = useCallback(
        (value: string) => getUpdatePreview("color")(value),
        [getUpdatePreview]
    );
    const updateWidth = useCallback(
        (value: string) => getUpdateValue("width")(value),
        [getUpdateValue]
    );

    return (
        <Accordion title={"Icon"} defaultValue={defaultAccordionValue}>
            <>
                <Wrapper containerClassName={classes.grid} label={"Icon"}>
                    <IconPicker
                        value={icon.id}
                        onChange={updateIcon}
                        removable={false}
                        useInSidebar={true}
                    />
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
                    rightCellClassName={classes.rightCellStyle}
                >
                    <InputField
                        className={classes.widthInputStyle}
                        value={icon.width}
                        onChange={updateWidth}
                        placeholder="50"
                    />
                </Wrapper>
            </>
        </Accordion>
    );
};

export default React.memo(IconSettings);
