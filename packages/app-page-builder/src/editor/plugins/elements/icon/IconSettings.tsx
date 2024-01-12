import React, { useCallback } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
// Components
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { ICON_PICKER_SIZE } from "@webiny/app-admin/components/IconPicker/types";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
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

    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data.icon",
        postModifyElement: updateIconElement
    });

    const updateIcon = useCallback(value => getUpdateValue("value")(value), [getUpdateValue]);
    const updateWidth = useCallback(
        (value: string) => getUpdateValue("width")(value),
        [getUpdateValue]
    );

    return (
        <Accordion title={"Icon"} defaultValue={defaultAccordionValue}>
            <>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Icon"}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <IconPicker
                        size={ICON_PICKER_SIZE.SMALL}
                        value={icon.value}
                        onChange={updateIcon}
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
