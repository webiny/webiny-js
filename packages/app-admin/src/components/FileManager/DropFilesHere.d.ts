import React from "react";
export declare type DropFilesHereProps = {
    onDragLeave?: (event?: React.DragEvent<HTMLElement>) => void;
    onDrop?: (event?: React.DragEvent<HTMLElement>) => void;
    empty?: boolean;
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
};
export default function DropFilesHere({ onDrop, onDragLeave, empty, onClick }: DropFilesHereProps): JSX.Element;
