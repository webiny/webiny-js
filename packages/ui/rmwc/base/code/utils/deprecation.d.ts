export declare type DeprecateT = {
    [oldPropName: string]: string | [string, (value: any) => void];
};
export declare const deprecationWarning: (message: string) => void;
export declare const handleDeprecations: (props: any, deprecate: DeprecateT, displayName: string) => any;
