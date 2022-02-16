import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Switch } from "@webiny/ui/Switch";
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

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
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

const DATA_NAMESPACE = "data.settings.visibility";

interface UseVisibilitySettingResult {
    element: PbEditorElement;
    updateVisibility: (value: boolean) => void;
}
export const useVisibilitySetting = (elementId: string): UseVisibilitySettingResult => {
    const { displayMode } = useRecoilValue(uiAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId)) as PbEditorElement;
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
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

const VisibilitySettings: React.FunctionComponent<
    PbEditorPageElementSettingsRenderComponentProps & {
        options: any;
    }
> = ({ defaultAccordionValue }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const activeElementId = useRecoilValue(activeElementAtom);
    const { element, updateVisibility } = useVisibilitySetting(activeElementId as string);

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
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const visibility = get(
        element,
        `${DATA_NAMESPACE}.${displayMode}`,
        fallbackValue || { hidden: false }
    );

    return (
        <Accordion
            title={"Visibility"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
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
        </Accordion>
    );
};

export default React.memo(VisibilitySettings);
