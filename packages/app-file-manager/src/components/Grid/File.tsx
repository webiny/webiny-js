import React, { Fragment } from "react";
/**
 * Package react-lazy-load has no types.
 */
// @ts-expect-error
import LazyLoad from "react-lazy-load";
import { makeDecoratable } from "@webiny/app-admin";
import { Text, TimeAgo, cn, CheckboxPrimitive } from "@webiny/admin-ui";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { FileItem } from "@webiny/app-admin/types";

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
                        "wby-p-xs wby-rounded-md",
                        "wby-bg-neutral-base/30",
                        "wby-absolute wby-top-sm wby-left-sm",
                        selected ? "wby-visible" : "wby-invisible group-hover:wby-visible"
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
                    "wby-invisible group-hover:wby-visible",
                    "wby-flex wby-items-center wby-gap-xxs",
                    "wby-p-xs",
                    "wby-absolute wby-top-xs-plus wby-right-xs-plus"
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
            className={cn(["wby-relative", onSelect ? "wby-cursor-pointer" : "wby-cursor-default"])}
        >
            <DefaultFileControls selected={selected} onSelect={onSelect} />
            <LazyLoad
                height={150}
                offsetVertical={300}
                data-testid={"fm-file-wrapper-file-preview"}
                className={cn([
                    "wby-bg-neutral-muted",
                    "wby-flex wby-items-center wby-justify-center",
                    "wby-text-neutral-strong wby-text-sm"
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
        <div className={"wby-px-md wby-py-sm-extra"} data-testid={"fm-file-wrapper-file-label"}>
            <Text size={"sm"} as={"div"} className={"wby-truncate wby-text-neutral-primary"}>
                {file.name}
            </Text>
            <Text size={"sm"} as={"div"} className={"wby-truncate wby-text-neutral-dimmed"}>
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
                    "wby-group",
                    "wby-bg-neutral-base wby-rounded-lg",
                    "wby-shadow-sm hover:wby-shadow-lg",
                    "wby-border-sm wby-border-solid wby-border-neutral-base hover:wby-border-neutral-dimmed-darker",
                    selected && "wby-ring-md wby-ring-primary-strong",
                    "wby-transition-shadow wby-duration-250 wby-ease-in-out",
                    "wby-overflow-hidden"
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
