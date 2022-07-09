import React, { useCallback, useEffect, useRef } from "react";
import { Compose, HigherOrderComponent } from "@webiny/app-admin";
import {
    EventActionHandlerProvider,
    EventActionHandlerProviderProps,
    GetCallableState,
    SaveCallableResults
} from "~/editor/contexts/EventActionHandlerProvider";
import { pageAtom, PageAtomType, revisionsAtom, RevisionsAtomType } from "~/editor/recoil/modules";
import { useRecoilState, useRecoilValue } from "recoil";

const PbEventActionHandlerHOC: HigherOrderComponent<
    EventActionHandlerProviderProps
> = Component => {
    return function PbEventActionHandlerProvider(props) {
        const pageAtomValueRef = useRef<PageAtomType>();
        const revisionsAtomValueRef = useRef<RevisionsAtomType>();
        const [pageAtomValue, setPageAtomValue] = useRecoilState(pageAtom);
        const revisionsAtomValue = useRecoilValue(revisionsAtom);

        useEffect(() => {
            pageAtomValueRef.current = pageAtomValue;
            revisionsAtomValueRef.current = revisionsAtomValue;
        }, [pageAtomValue, revisionsAtomValue]);

        const saveCallablesResults: SaveCallableResults = useCallback(
            next =>
                ({ state, history = true }) => {
                    const res = next({ state, history });
                    if (res.state.page) {
                        setPageAtomValue(res.state.page);
                    }

                    return { state, history };
                },
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
                saveCallablesResults={[...(props.saveCallablesResults || []), saveCallablesResults]}
            />
        );
    };
};

export const EventActionHandlerPlugin = () => {
    return <Compose component={EventActionHandlerProvider} with={PbEventActionHandlerHOC} />;
};
