import * as React from "react";
import { IconButton, IconButtonProps as BaseIconProps } from "@webiny/ui/Button";
import { ReactComponent as AutoRenew } from "./baseline-autorenew-24px.svg";
import { ReactComponent as Pen } from "./baseline-edit-24px.svg";
import { ReactComponent as Delete } from "./baseline-delete-24px.svg";
import { ReactComponent as Sort } from "./baseline-sort-24px.svg";
import { ReactComponent as NavigateBefore } from "./baseline-navigate_before-24px.svg";
import { ReactComponent as NavigateNext } from "./baseline-navigate_next-24px.svg";
import { ReactComponent as TuneIcon } from "./baseline-tune-24px.svg";

type IconButtonProps = Omit<BaseIconProps, "icon"> & {
    icon?: React.ReactElement<any>;
};

export const RefreshIcon = (props: IconButtonProps) => {
    return <IconButton icon={<AutoRenew />} {...props} />;
};

export const DeleteIcon = (props: IconButtonProps) => {
    return <IconButton icon={<Delete />} {...props} />;
};

export const CreateIcon = (props: IconButtonProps) => {
    return <IconButton icon={<Pen />} {...props} />;
};

export const EditIcon = (props: IconButtonProps) => {
    return <IconButton icon={<Pen />} {...props} />;
};

export const SortIcon = (props: IconButtonProps) => {
    return <IconButton icon={<Sort />} {...props} />;
};

export const PreviousPageIcon = (props: IconButtonProps) => {
    return <IconButton icon={<NavigateBefore />} {...props} />;
};

export const NextPageIcon = (props: IconButtonProps) => {
    return <IconButton icon={<NavigateNext />} {...props} />;
};

export const OptionsIcon = (props: IconButtonProps) => {
    return <IconButton icon={<TuneIcon />} {...props} />;
};
