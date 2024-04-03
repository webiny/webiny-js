import React, { useEffect, useMemo, useRef } from "react";
import { createDecorator, DecoratableComponent, GenericComponent } from "@webiny/app-admin";
import {
    EventActionHandlerProvider,
    EventActionHandlerProviderProps,
    GetCallableState
} from "~/editor/contexts/EventActionHandlerProvider";
import { TemplateEditorEventActionCallableState } from "~/templateEditor/types";
import { PageTemplate } from "~/templateEditor/state";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { PbElement, PbEditorElement } from "~/types";

type ProviderProps = EventActionHandlerProviderProps<TemplateEditorEventActionCallableState>;

export const EventActionHandlerDecorator = createDecorator(
    EventActionHandlerProvider as DecoratableComponent<GenericComponent<ProviderProps>>,
    Component => {
        return function PbEventActionHandlerProvider(props) {
            const templateAtomValueRef = useRef<PageTemplate>();
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
                    template: templateAtomValueRef.current as PageTemplate,
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
