import React, { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { PbEditorPageElementSettingsRenderComponentProps } from "../../../../types";
import { activeElementSelector } from "../../../recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import SpacingPicker from "../../elementSettings/components/SpacingPicker";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import { justifySelfEndStyle } from "../../elementSettings/components/StyledComponents";
import {
    WIDTH_UNIT_OPTIONS,
    HEIGHT_UNIT_OPTIONS
} from "../../elementSettings/elementSettingsUtils";

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

const ImageSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue = false
}) => {
    const element = useRecoilValue(activeElementSelector);
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
                        value={image?.width || ""}
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
                        value={image?.height || ""}
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
