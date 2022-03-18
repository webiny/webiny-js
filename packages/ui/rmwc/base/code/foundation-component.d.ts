/* eslint-disable */
import * as RMWC from "@rmwc/types";
import { SpecificEventListener } from "@material/base/types";
import * as React from "react";
export declare class FoundationElement<Props, ElementType = HTMLElement> {
    private _classes;
    private _events;
    private _style;
    private _props;
    private _ref;
    _onChange: (() => void) | null;
    constructor(onChange: () => void);
    onChange(): void;
    destroy(): void;
    /**************************************************
     * Classes
     **************************************************/
    addClass(className: string): void;
    removeClass(className: string): void;
    hasClass(className: string): boolean;
    /**************************************************
     * Props
     **************************************************/
    setProp(propName: keyof Props, value: any): void;
    getProp(propName: keyof Props): Partial<Props>[keyof Props];
    removeProp(propName: keyof Props): void;
    props(propsToMerge: { [key: string]: any }): any;
    /**************************************************
     * Styles
     **************************************************/
    setStyle(propertyName: string, value: number | string | null): void;
    /**************************************************
     * Events
     **************************************************/
    addEventListener(evtName: string, callback: SpecificEventListener<any>): void;
    removeEventListener(evtName: string, callback: SpecificEventListener<any>): void;
    /**************************************************
     * Refs
     **************************************************/
    setRef(el: any): void;
    readonly ref: ElementType | null;
}
declare type ExtractProps<TComponentOrTProps> = TComponentOrTProps extends React.Component<
    infer TProps,
    any
>
    ? TProps
    : TComponentOrTProps;
export interface FoundationProps extends RMWC.ComponentProps {}
interface FoundationState {}
declare type FoundationPropsT<P> = RMWC.MergeInterfacesT<P, FoundationProps>;
declare type FoundationStateT<S> = S & FoundationState;
export declare class FoundationComponent<
    Foundation extends any,
    P,
    S extends any = {}
> extends React.Component<FoundationPropsT<P>, FoundationStateT<S>> {
    static shouldDebounce: boolean;
    foundation: Foundation;
    elements: {
        [key: string]: FoundationElement<any, any>;
    };
    constructor(props: any);
    public override componentDidMount(): void;
    componentDidUpdate(prevProps: FoundationPropsT<P>): void;
    componentWillUnmount(): void;
    createElement<ElementType extends HTMLElement = HTMLElement>(
        elementName: string
    ): FoundationElement<ExtractProps<ElementType>, ElementType>;
    update(): void;
    sync(props: any, prevProps?: any): void;
    syncProp(prop: any, prevProp: any, callback: () => void): void;
    getDefaultFoundation(): Foundation;
    /**
     * Fires a cross-browser-compatible custom event from the component root of the given type,
     */
    emit(evtType: string, evtData: any, shouldBubble?: boolean): CustomEvent<any>;
}
export {};
