import * as React from "react";
import { IconButtonProps as BaseIconProps } from "@webiny/ui/Button";
declare type IconButtonProps = Omit<BaseIconProps, "icon"> & {
    icon?: React.ReactElement<any>;
};
export declare const RefreshIcon: (props: IconButtonProps) => JSX.Element;
export declare const DeleteIcon: (props: IconButtonProps) => JSX.Element;
export declare const CreateIcon: (props: IconButtonProps) => JSX.Element;
export declare const EditIcon: (props: IconButtonProps) => JSX.Element;
export declare const SortIcon: (props: IconButtonProps) => JSX.Element;
export declare const PreviousPageIcon: (props: IconButtonProps) => JSX.Element;
export declare const NextPageIcon: (props: IconButtonProps) => JSX.Element;
export declare const OptionsIcon: (props: IconButtonProps) => JSX.Element;
export {};
