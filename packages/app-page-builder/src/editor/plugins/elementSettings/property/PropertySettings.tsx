import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Switch } from "@webiny/ui/Switch";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import {
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "~/types";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "../../../recoil/modules";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import InputField from "../components/InputField";
import { ContentWrapper } from "../components/StyledComponents";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            margin: "0px 0px 16px"
        }
    }),
    rightCellStyle: css({
        justifySelf: "end",
        alignSelf: "center"
    }),
    leftCellStyle: css({
        alignSelf: "center"
    })
};

const DATA_NAMESPACE = "data.settings.property";

interface UseVisibilitySettingResult {
    element: PbEditorElement;
    updateVisibility: (value: boolean) => void;
}
export const useVisibilitySetting = (elementId: string): UseVisibilitySettingResult => {
    const { displayMode } = useRecoilValue(uiAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId)) as PbEditorElement;
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: `${DATA_NAMESPACE}.visibility`
    });

    const updateVisibility = useCallback(
        (value: boolean) => getUpdateValue(`${displayMode}.hidden`)(value),
        [getUpdateValue, displayMode]
    );

    return {
        element,
        updateVisibility
    };
};

const PropertySettings: React.FC<
    PbEditorPageElementSettingsRenderComponentProps & {
        options: any;
    }
> = ({ defaultAccordionValue }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const activeElementId = useRecoilValue(activeElementAtom);
    const { element, updateVisibility } = useVisibilitySetting(activeElementId as string);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const memoizedResponsiveModePlugin = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const { config: activeDisplayModeConfig } = memoizedResponsiveModePlugin || {
        config: {
            displayMode: null,
            icon: null
        }
    };

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.visibility.${mode}`)
            ),
        [displayMode]
    );

    const visibility = get(
        element,
        `${DATA_NAMESPACE}.visibility.${displayMode}`,
        fallbackValue || { hidden: false }
    );

    return (
        <Accordion
            title={"Property"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
            <ContentWrapper direction={"column"}>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Hide element"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                    leftCellClassName={classes.leftCellStyle}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <Switch value={visibility.hidden} onChange={updateVisibility} />
                </Wrapper>
                <Wrapper label={"Element ID"} containerClassName={classes.grid}>
                    <DelayedOnChange
                        value={get(element, DATA_NAMESPACE + ".id", 0)}
                        onChange={getUpdateValue("id")}
                    >
                        {({ value, onChange }) => <InputField value={value} onChange={onChange} />}
                    </DelayedOnChange>
                </Wrapper>
                <Wrapper label={"CSS class"} containerClassName={classes.grid}>
                    <DelayedOnChange
                        value={get(element, DATA_NAMESPACE + ".className", 0)}
                        onChange={getUpdateValue("className")}
                    >
                        {({ value, onChange }) => <InputField value={value} onChange={onChange} />}
                    </DelayedOnChange>
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(PropertySettings);
