import * as React from "react";
export declare type IconProps = {
    /**
     * SvgComponent containing the svg icon
     */
    icon: React.ReactElement<any>;
    /**
     * Optional onclick handler
     */
    onClick?: Function;
    /**
     * CSS class to be added to the icon
     */
    className?: string;
};
/**
 * Use Icon component to display an icon.
 * @param props
 * @returns {*}
 * @constructor
 */
declare const Icon: (props: IconProps) => React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)>;
export { Icon };
