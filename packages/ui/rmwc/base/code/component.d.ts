import * as RMWC from '@rmwc/types';
import * as React from 'react';
import { DeprecateT } from './utils/deprecation';
declare type ClassNamesInputT = ((props: any) => Array<string | undefined | null | {
    [className: string]: boolean | undefined | string | number;
}>) | string[];
interface ComponentFactoryOpts<Props> {
    displayName: string;
    classNames?: ClassNamesInputT;
    tag?: RMWC.TagT;
    deprecate?: DeprecateT;
    consumeProps?: string[];
    defaultProps?: any & Partial<RMWC.ComponentProps & Props>;
    render?: (props: any, ref: React.Ref<any>, tag: RMWC.TagT) => React.ReactElement<any>;
}
export declare const componentFactory: <P extends {}>({ displayName, classNames, tag: defaultTag, deprecate, defaultProps, consumeProps, render }: ComponentFactoryOpts<P>) => React.ComponentType<RMWC.MergeInterfacesT<P, RMWC.ComponentProps>>;
export {};
