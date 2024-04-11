import React, { useEffect, useMemo, useRef } from "react";
import { DecoratableComponent, GenericComponent, createDecorator } from "@webiny/app-admin";
import {
    EventActionHandlerProvider,
    EventActionHandlerProviderProps,
    GetCallableState
} from "~/editor/contexts/EventActionHandlerProvider";
import { usePage } from "~/pageEditor/hooks/usePage";
import { useRevisions } from "~/pageEditor/hooks/useRevisions";
import { TemplateModeAtomType, useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { PageAtomType, RevisionsAtomType } from "~/pageEditor/state";
import { PageEditorEventActionCallableState } from "~/pageEditor/types";
import { PbElement, PbEditorElement } from "~/types";

type ProviderProps = EventActionHandlerProviderProps<PageEditorEventActionCallableState>;

export const EventActionHandlerDecorator = createDecorator(
    EventActionHandlerProvider as unknown as DecoratableComponent<GenericComponent<ProviderProps>>,
    Component => {
        return function PbEventActionHandlerProvider(props) {
            const pageAtomValueRef = useRef<PageAtomType>();
            const revisionsAtomValueRef = useRef<RevisionsAtomType>();
            const templateModeAtomValueRef = useRef<TemplateModeAtomType>();
            const [pageAtomValue, setPageAtomValue] = usePage();
            const [revisionsAtomValue] = useRevisions();
            const [templateModeAtomValue] = useTemplateMode();

            useEffect(() => {
                pageAtomValueRef.current = pageAtomValue;
                revisionsAtomValueRef.current = revisionsAtomValue;
                templateModeAtomValueRef.current = templateModeAtomValue;
            }, [pageAtomValue, revisionsAtomValue, templateModeAtomValue]);

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
                            if (res.state.page) {
                                setPageAtomValue(res.state.page);
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
                    page: pageAtomValueRef.current as PageAtomType,
                    revisions: revisionsAtomValueRef.current as RevisionsAtomType,
                    isTemplateMode: templateModeAtomValueRef.current as TemplateModeAtomType,
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
