import React, { Fragment } from "react";
/**
 * Package react-lazy-load has no types.
 */
// @ts-expect-error
import LazyLoad from "react-lazy-load";
import { makeDecoratable } from "@webiny/app-admin";
import { Text, TimeAgo, cn, CheckboxPrimitive } from "@webiny/admin-ui";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import type { FileItem } from "@webiny/app-admin/types.js";

export interface FileProps {
    file: FileItem;
    selected: boolean;
    fileBody?: JSX.Element;
    onSelect?: (event?: React.MouseEvent) => void;
    onClick?: (event?: React.MouseEvent) => void;
    multiple?: boolean;
    children: React.ReactNode;
}

export type DefaultFileControlsProps = Pick<FileProps, "selected" | "onSelect">;

const DefaultFileControls = ({ onSelect, selected }: DefaultFileControlsProps) => {
    const { browser } = useFileManagerViewConfig();
    const { itemActions } = browser.grid;

    return (
        <>
            {onSelect ? (
                <div
                    className={cn([
                        "p-xs rounded-md",
                        "bg-neutral-base/30",
                        "absolute top-sm left-sm",
                        selected ? "visible" : "invisible group-hover:visible"
                    ])}
                >
                    <CheckboxPrimitive
                        onClick={onSelect}
                        checked={selected}
                        onChange={() => void 0}
                    />
                </div>
            ) : null}
            <div
                className={cn([
                    "invisible group-hover:visible",
                    "flex items-center gap-xxs",
                    "p-xs",
                    "absolute top-xs-plus right-xs-plus"
                ])}
            >
                {itemActions.map(action => {
                    return <Fragment key={action.name}>{action.element}</Fragment>;
                })}
            </div>
        </>
    );
};

export type DefaultFileBodyProps = Pick<FileProps, "selected" | "onSelect" | "children">;

const DefaultFileBody = ({ selected, onSelect, children }: DefaultFileBodyProps) => {
    return (
        <div
            onClick={onSelect}
            className={cn(["relative", onSelect ? "cursor-pointer" : "cursor-default"])}
        >
            <DefaultFileControls selected={selected} onSelect={onSelect} />
            <LazyLoad
                height={150}
                offsetVertical={300}
                data-testid={"fm-file-wrapper-file-preview"}
                className={cn([
                    "bg-neutral-muted",
                    "flex items-center justify-center",
                    "text-neutral-strong text-sm"
                ])}
            >
                {children}
            </LazyLoad>
        </div>
    );
};

type DefaultFileLabelProps = Pick<FileProps, "file">;

const DefaultFileLabel = ({ file }: DefaultFileLabelProps) => {
    return (
        <div className={"px-md py-sm-extra"} data-testid={"fm-file-wrapper-file-label"}>
            <Text size={"sm"} as={"div"} className={"truncate text-neutral-primary"}>
                {file.name}
            </Text>
            <Text size={"sm"} as={"div"} className={"truncate text-neutral-dimmed"}>
                {file.type} {" // "} <TimeAgo datetime={file.createdOn} />
            </Text>
        </div>
    );
};

export const File = makeDecoratable(
    "File",
    ({ file, fileBody, selected, onSelect, children }: FileProps) => {
        return (
            <div
                className={cn([
                    "group",
                    "bg-neutral-base rounded-lg",
                    "shadow-sm hover:shadow-lg",
                    "border-sm border-solid border-neutral-base hover:border-neutral-dimmed-darker",
                    selected && "ring-md ring-primary-strong",
                    "transition-shadow duration-250 ease-in-out",
                    "overflow-hidden"
                ])}
                data-testid={"fm-list-wrapper-file"}
                data-file-id={file.id}
            >
                {fileBody ?? (
                    <DefaultFileBody selected={selected} onSelect={onSelect}>
                        {children}
                    </DefaultFileBody>
                )}
                <DefaultFileLabel file={file} />
            </div>
        );
    }
);
