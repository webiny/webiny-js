import React from "react";
declare type Props = {
    file: {
        [key: string]: any;
    };
    selected: boolean;
    uploadFile: Function;
    onSelect: (event?: React.MouseEvent) => void;
    onClick: (event?: React.MouseEvent) => void;
    options?: Array<{
        label: string;
        onClick: (file: Object) => void;
    }>;
    children: React.ReactNode;
    showFileDetails: (event?: React.MouseEvent) => void;
};
declare const _default: React.NamedExoticComponent<Props>;
export default _default;
