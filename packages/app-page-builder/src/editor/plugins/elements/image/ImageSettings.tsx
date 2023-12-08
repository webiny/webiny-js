import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { activeElementAtom, elementByIdSelector } from "~/editor/recoil/modules";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
// Components
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import Wrapper from "~/editor/plugins/elementSettings/components/Wrapper";
import InputField from "~/editor/plugins/elementSettings/components/InputField";
import SpacingPicker from "~/editor/plugins/elementSettings/components/SpacingPicker";
import useUpdateHandlers from "~/editor/plugins/elementSettings/useUpdateHandlers";
import { justifySelfEndStyle } from "~/editor/plugins/elementSettings/components/StyledComponents";
import {
    WIDTH_UNIT_OPTIONS,
    HEIGHT_UNIT_OPTIONS
} from "~/editor/plugins/elementSettings/elementSettingsUtils";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

const spacingPickerStyle = css({
    width: "120px",
    "& .inner-wrapper": {
        display: "flex"
    }
});

const ImageSettings = ({
    defaultAccordionValue = false
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const activeElementId = useRecoilValue(activeElementAtom) as string;
    const element = useRecoilValue(elementByIdSelector(activeElementId)) as PbEditorElement;
    const {
        data: { image }
    } = element;

    const { getUpdateValue } = useUpdateHandlers({ element, dataNamespace: "data.image" });

    const updateTitle = useCallback(value => getUpdateValue("title")(value), []);
    const updateWidth = useCallback(value => getUpdateValue("width")(value), []);
    const updateHeight = useCallback(value => getUpdateValue("height")(value), []);

    return (
        <Accordion title={"Image"} defaultValue={defaultAccordionValue}>
            <>
                <Wrapper containerClassName={classes.grid} label={"Title"}>
                    <InputField value={image?.title || ""} onChange={updateTitle} />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Width"}
                    rightCellClassName={justifySelfEndStyle}
                >
                    <SpacingPicker
                        value={(image?.width as string) || ""}
                        onChange={updateWidth}
                        options={WIDTH_UNIT_OPTIONS}
                        useDefaultStyle={false}
                        className={spacingPickerStyle}
                    />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Height"}
                    rightCellClassName={justifySelfEndStyle}
                >
                    <SpacingPicker
                        value={(image?.height as string) || ""}
                        onChange={updateHeight}
                        options={HEIGHT_UNIT_OPTIONS}
                        useDefaultStyle={false}
                        className={spacingPickerStyle}
                    />
                </Wrapper>
            </>
        </Accordion>
    );
};
export default React.memo(ImageSettings);
