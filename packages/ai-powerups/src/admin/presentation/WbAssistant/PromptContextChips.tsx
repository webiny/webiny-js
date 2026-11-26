import React from "react";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { FileManager } from "@webiny/app-admin";
import type { FileManagerFileItem } from "@webiny/app-admin";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as AttachIcon } from "@webiny/icons/attach_file.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as FileIcon } from "@webiny/icons/description.svg";
import { PromptContextFeature } from "./promptContextFeature.js";
import type { PromptContextPresenter } from "./abstractions.js";

/** What the server reads an attached file as. */
const ACCEPT = [
    "text/*",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const CHIP =
    "inline-flex h-[24px] max-w-full items-center gap-xs rounded-full border-sm border-solid " +
    "border-neutral-muted bg-neutral-base px-sm text-sm text-neutral-primary transition-colors " +
    "hover:bg-neutral-light [&_svg]:size-[14px] [&_svg]:shrink-0 [&_svg]:fill-neutral-strong";

interface PickerProps {
    label: string;
    noneLabel: string;
    options: PromptContextPresenter.Option[];
    selected: PromptContextPresenter.Option | null;
    onSelect: (id: string | null) => void;
}

const Picker = ({ label, noneLabel, options, selected, onSelect }: PickerProps) => {
    if (options.length === 0) {
        return null;
    }

    return (
        <DropdownMenu
            trigger={
                <button type="button" className={CHIP} aria-label={`${label}: choose`}>
                    <span className="text-neutral-strong">{label}</span>
                    <span className="truncate">{selected?.name ?? "None"}</span>
                    <ArrowDownIcon />
                </button>
            }
        >
            <DropdownMenu.Label text={label} />
            {options.map(option => (
                <DropdownMenu.CheckboxItem
                    key={option.id}
                    checked={selected?.id === option.id}
                    onCheckedChange={() => onSelect(option.id)}
                    text={
                        <span className="flex flex-col">
                            <span>{option.name}</span>
                            {option.description ? (
                                <span className="text-sm text-neutral-strong line-clamp-1">
                                    {option.description}
                                </span>
                            ) : null}
                        </span>
                    }
                />
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.CheckboxItem
                checked={!selected}
                onCheckedChange={() => onSelect(null)}
                text={noneLabel}
            />
        </DropdownMenu>
    );
};

const toFile = (item: FileManagerFileItem): PromptContextPresenter.File => {
    return { id: item.id, name: item.name ?? item.id };
};

/**
 * The page editor's composer controls: who the assistant writes for, in whose voice, for which
 * project, and the files it may read.
 */
export const PromptContextChips = observer(() => {
    const { promptContext } = useFeature(PromptContextFeature);
    const vm = promptContext.vm;

    useEffect(() => {
        promptContext.load();
    }, []);

    return (
        <>
            <Picker
                label="Project"
                noneLabel="No project"
                options={vm.projects}
                selected={vm.project}
                onSelect={promptContext.setProject}
            />
            <Picker
                label="Reader"
                noneLabel="No reader persona"
                options={vm.readerPersonas}
                selected={vm.readerPersona}
                onSelect={promptContext.setReaderPersona}
            />
            <Picker
                label="Writer"
                noneLabel="No writer persona"
                options={vm.writerPersonas}
                selected={vm.writerPersona}
                onSelect={promptContext.setWriterPersona}
            />
            {vm.files.map(file => (
                <span key={file.id} className={CHIP}>
                    <FileIcon />
                    <span className="truncate">{file.name}</span>
                    <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        className="inline-flex"
                        onClick={() => promptContext.removeFile(file.id)}
                    >
                        <CloseIcon />
                    </button>
                </span>
            ))}
            <FileManager
                multiple
                accept={ACCEPT}
                render={({ showFileManager }) => (
                    <button
                        type="button"
                        className={CHIP}
                        onClick={() =>
                            showFileManager((items: FileManagerFileItem[]) => {
                                promptContext.attachFiles(items.map(toFile));
                            })
                        }
                    >
                        <AttachIcon />
                        <span>Attach files</span>
                    </button>
                )}
            />
        </>
    );
});
