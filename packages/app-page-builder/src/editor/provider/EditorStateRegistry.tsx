import React, { useEffect } from "react";
import {
    elementsAtom,
    ElementsAtomType, pageAtom,
    PageAtomType, pluginsAtom,
    PluginsAtomType, uiAtom,
    UiAtomType
} from "@webiny/app-page-builder/editor/recoil/modules";
import { SetterOrUpdater, useRecoilState } from "recoil";

type StateRegistryValue<T> = [T, SetterOrUpdater<T>];
const mapRecoilState = <T extends any>(state: StateRegistryValue<T>) => {
    return {
        value: state[0],
        setValue: state[1],
    };
};


type StateRegistryObjectType<T> = {
    value: T;
    setValue: SetterOrUpdater<T>
};
type StateRegistryType = {
    elements: StateRegistryObjectType<ElementsAtomType>,
    plugins: StateRegistryObjectType<PluginsAtomType>,
    page: StateRegistryObjectType<PageAtomType>,
    ui: StateRegistryObjectType<UiAtomType>,
};
let stateRegistry: StateRegistryType;
export const EditorStateRegistry = () => {
    stateRegistry = {
        elements: mapRecoilState<ElementsAtomType>(useRecoilState(elementsAtom)),
        plugins: mapRecoilState<PluginsAtomType>(useRecoilState(pluginsAtom)),
        page: mapRecoilState<PageAtomType>(useRecoilState(pageAtom)),
        ui: mapRecoilState<UiAtomType>(useRecoilState(uiAtom)),
    };
    useEffect(() => {
        return () => {
            stateRegistry = null as any;
        };
    }, []);
    return null;
};
export const getStateRegistry = () => {
    return stateRegistry;
};