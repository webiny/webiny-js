import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import merge from "lodash/merge";
import set from "lodash/set";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Switch } from "@webiny/ui/Switch";
import { Form, FormOnSubmit } from "@webiny/form";
import { Validator } from "@webiny/validation/types";
import {
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "~/types";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "~/editor/recoil/modules";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { applyFallbackDisplayMode } from "~/editor/plugins/elementSettings/elementSettingsUtils";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
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

const validateId: Validator = (value: string | undefined) => {
    if (!value) {
        return true;
    }

    if (/^[a-zA-Z0-9_-]*$/.test(value)) {
        return true;
    }

    throw Error(
        'Element ID can only contain letters, numbers and chars ("-", "_") without any spaces.'
    );
};

const validateClassName: Validator = (value: string | undefined) => {
    if (!value) {
        return true;
    }

    if (/^[a-zA-Z0-9_ -]*$/.test(value)) {
        return true;
    }

    throw Error('Class name can only contain letters, numbers and chars ("-", "_", " ").');
};

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

type PropertySettingsProps = PbEditorPageElementSettingsRenderComponentProps & {
    options: any;
};

const PropertySettings = ({ defaultAccordionValue }: PropertySettingsProps) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const handler = useEventActionHandler();

    const updateSettings: FormOnSubmit = async (data, form) => {
        const valid = await form.validate();
        if (!valid) {
            return null;
        }

        const newElement: PbEditorElement = merge(
            {},
            element,
            set({}, `${DATA_NAMESPACE}.visibility.${displayMode}`, { hidden: data.hidden }),
            set({}, `${DATA_NAMESPACE}.id`, data.id),
            set({}, `${DATA_NAMESPACE}.className`, data.className)
        );

        return handler.trigger(
            new UpdateElementActionEvent({
                element: newElement,
                history: true
            })
        );
    };

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

    const settings = React.useMemo(() => {
        const visibilityFallbackValue = applyFallbackDisplayMode(displayMode, mode =>
            get(element, `${DATA_NAMESPACE}.visibility.${mode}`)
        );
        const visibility = get(
            element,
            `${DATA_NAMESPACE}.visibility.${displayMode}`,
            visibilityFallbackValue || { hidden: false }
        );

        return {
            className: get(element, `${DATA_NAMESPACE}.className`, ""),
            id: get(element, `${DATA_NAMESPACE}.id`, ""),
            hidden: visibility.hidden
        };
    }, [displayMode, element]);

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
            <Form
                data={settings}
                onChange={(data, form) => {
                    if (!form) {
                        return;
                    }
                    return updateSettings(data, form);
                }}
            >
                {({ Bind }) => {
                    return (
                        <ContentWrapper direction={"column"}>
                            <Wrapper
                                containerClassName={classes.grid}
                                label={"Hide element"}
                                leftCellSpan={8}
                                rightCellSpan={4}
                                leftCellClassName={classes.leftCellStyle}
                                rightCellClassName={classes.rightCellStyle}
                            >
                                <Bind name={"hidden"}>
                                    {({ value, onChange }) => (
                                        <Switch value={value} onChange={onChange} />
                                    )}
                                </Bind>
                            </Wrapper>
                            <Wrapper label={"Element ID"} containerClassName={classes.grid}>
                                <Bind name={"id"} validators={validateId}>
                                    {({ value, onChange, validation }) => (
                                        <InputField
                                            value={value}
                                            onChange={onChange}
                                            validation={validation}
                                        />
                                    )}
                                </Bind>
                            </Wrapper>
                            <Wrapper label={"CSS class"} containerClassName={classes.grid}>
                                <Bind name={"className"} validators={validateClassName}>
                                    {({ value, onChange, validation }) => (
                                        <InputField
                                            value={value}
                                            onChange={onChange}
                                            validation={validation}
                                        />
                                    )}
                                </Bind>
                            </Wrapper>
                        </ContentWrapper>
                    );
                }}
            </Form>
        </Accordion>
    );
};

export default React.memo(PropertySettings);
