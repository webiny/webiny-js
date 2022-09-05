import React, { useEffect, useMemo, useRef } from "react";
import { ComposableFC, createComponentPlugin } from "@webiny/app-admin";
import {
    EventActionHandlerProvider,
    EventActionHandlerProviderProps,
    GetCallableState
} from "~/editor/contexts/EventActionHandlerProvider";
import { usePage } from "~/pageEditor/hooks/usePage";
import { useRevisions } from "~/pageEditor/hooks/useRevisions";
import { PageAtomType, RevisionsAtomType } from "~/pageEditor/state";
import { PageEditorEventActionCallableState } from "~/pageEditor/types";

type ProviderProps = EventActionHandlerProviderProps<PageEditorEventActionCallableState>;

const PbEventActionHandler = createComponentPlugin(
    EventActionHandlerProvider as ComposableFC<ProviderProps>,
    Component => {
        return function PbEventActionHandlerProvider(props) {
            const pageAtomValueRef = useRef<PageAtomType>();
            const revisionsAtomValueRef = useRef<RevisionsAtomType>();
            const [pageAtomValue, setPageAtomValue] = usePage();
            const [revisionsAtomValue] = useRevisions();

            useEffect(() => {
                pageAtomValueRef.current = pageAtomValue;
                revisionsAtomValueRef.current = revisionsAtomValue;
            }, [pageAtomValue, revisionsAtomValue]);

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
                    ...callableState
                };
            };

            return (
                <Component
                    {...props}
                    getCallableState={[...(props.getCallableState || []), getCallableState]}
                    saveCallablesResults={saveCallablesResults}
                />
            );
        };
    }
);

export const EventActionHandlerPlugin = () => {
    return <PbEventActionHandler />;
};
