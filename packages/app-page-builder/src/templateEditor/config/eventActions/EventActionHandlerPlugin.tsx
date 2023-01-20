import React, { useEffect, useMemo, useRef } from "react";
import { ComposableFC, createComponentPlugin } from "@webiny/app-admin";
import {
    EventActionHandlerProvider,
    EventActionHandlerProviderProps,
    GetCallableState
} from "~/editor/contexts/EventActionHandlerProvider";
import { TemplateEditorEventActionCallableState } from "~/templateEditor/types";
import { TemplateAtomType } from "~/templateEditor/state";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { PbElement, PbEditorElement } from "~/types";

type ProviderProps = EventActionHandlerProviderProps<TemplateEditorEventActionCallableState>;

export const EventActionHandlerPlugin = createComponentPlugin(
    EventActionHandlerProvider as ComposableFC<ProviderProps>,
    Component => {
        return function PbEventActionHandlerProvider(props) {
            const templateAtomValueRef = useRef<TemplateAtomType>();
            const [templateAtomValue, setTemplateAtomValue] = useTemplate();

            useEffect(() => {
                templateAtomValueRef.current = templateAtomValue;
            }, [templateAtomValue]);

            const getElementTree: ProviderProps["getElementTree"] = useMemo(
                () => [
                    ...(props.getElementTree || []),
                    next => {
                        return async props => {
                            const element = props?.element;
                            const res = (await next({ element })) as PbElement;

                            const cleanUpReferenceBlocks = (
                                element: PbElement
                            ): PbEditorElement => {
                                if (element.data.blockId) {
                                    return {
                                        ...element,
                                        elements: []
                                    };
                                } else {
                                    return {
                                        ...element,
                                        elements: element.elements.map((child: PbElement) =>
                                            cleanUpReferenceBlocks(child)
                                        )
                                    };
                                }
                            };

                            return cleanUpReferenceBlocks(res);
                        };
                    }
                ],
                []
            );

            const saveCallablesResults: ProviderProps["saveCallablesResults"] = useMemo(
                () => [
                    ...(props.saveCallablesResults || []),
                    next => {
                        return ({ state, history = true }) => {
                            const res = next({ state, history });
                            if (res.state.template) {
                                setTemplateAtomValue(res.state.template);
                            }

                            return { state, history };
                        };
                    }
                ],
                []
            );

            const getCallableState: GetCallableState = next => state => {
                const callableState = next(state);

                return {
                    template: templateAtomValueRef.current as TemplateAtomType,
                    ...callableState
                };
            };

            return (
                <Component
                    {...props}
                    getElementTree={getElementTree}
                    getCallableState={[...(props.getCallableState || []), getCallableState]}
                    saveCallablesResults={saveCallablesResults}
                />
            );
        };
    }
);
