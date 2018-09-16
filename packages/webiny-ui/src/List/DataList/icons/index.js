// @flow
import * as React from "react";
import { IconButton } from "webiny-ui/Button";

import { ReactComponent as AutoRenew } from "./baseline-autorenew-24px.svg";
import { ReactComponent as Pen } from "./baseline-edit-24px.svg";
import { ReactComponent as Delete } from "./baseline-delete-24px.svg";
import { ReactComponent as Sort } from "./baseline-sort-24px.svg";
import { ReactComponent as NavigateBefore } from "./baseline-navigate_before-24px.svg";
import { ReactComponent as NavigateNext } from "./baseline-navigate_next-24px.svg";
import { ReactComponent as TuneIcon } from "./baseline-tune-24px.svg";

export const RefreshIcon = (props: Object = {}) => {
    return <IconButton icon={<AutoRenew />} {...props} />;
};

export const DeleteIcon = (props: Object = {}) => {
    return <IconButton icon={<Delete />} {...props} />;
};

export const CreateIcon = (props: Object = {}) => {
    return <IconButton icon={<Pen />} {...props} />;
};

export const EditIcon = (props: Object = {}) => {
    return <IconButton icon={<Pen />} {...props} />;
};

export const SortIcon = (props: Object = {}) => {
    return <IconButton icon={<Sort />} {...props} />;
};

export const PreviousPageIcon = (props: Object = {}) => {
    return <IconButton icon={<NavigateBefore />} {...props} />;
};

export const NextPageIcon = (props: Object = {}) => {
    return <IconButton icon={<NavigateNext />} {...props} />;
};

export const OptionsIcon = (props: Object = {}) => {
    return <IconButton icon={<TuneIcon />} {...props} />;
};
