import React, { useState } from "react";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Dialog, Text, Input, Icon, IconButton, DelayedOnChange } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as PlusIcon } from "@webiny/icons/add_circle_outline.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/view_list.svg";
import type { ITemplateIcon, ITemplateVM } from "~/features/formModel/index.js";

const normalizeIcon = (icon: ITemplateIcon | undefined): IconProp | undefined => {
    if (!icon) {
        return undefined;
    }
    return icon.name.split("/") as IconProp;
};

export interface AddTemplateButtonProps {
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
    label?: string;
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "secondary" | "tertiary";
}

export const AddTemplateButton = ({
    templates,
    onSelect,
    label = "Add a template",
    size = "sm",
    variant = "tertiary"
}: AddTemplateButtonProps) => {
    return (
        <div className={"flex justify-between items-center"}>
            <Dialog
                size={"lg"}
                className={"w-[800px]"}
                trigger={<Button size={size} variant={variant} text={label} icon={<AddIcon />} />}
                title={"Insert a template"}
                info={<></>}
            >
                <TemplateGallery templates={templates} onSelect={onSelect} />
            </Dialog>
        </div>
    );
};

interface TemplateGalleryProps {
    templates: ITemplateVM[];
    onSelect: (template: ITemplateVM) => void;
}

const TemplateGallery = ({ templates, onSelect }: TemplateGalleryProps) => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");

    const filteredTemplates = templates.filter(template =>
        template.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className={"flex items-center gap-sm px-xs pb-xs"}>
                <div className={"flex-1"}>
                    <DelayedOnChange value={search} onChange={setSearch}>
                        {({ value, onChange }) => (
                            <Input
                                value={value}
                                onChange={onChange}
                                placeholder={"Search templates..."}
                                startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                                size={"md"}
                                variant={"ghost"}
                            />
                        )}
                    </DelayedOnChange>
                </div>
                <IconButton
                    icon={<GridIcon />}
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size={"sm"}
                    onClick={() => setViewMode("grid")}
                />
                <IconButton
                    icon={<ListIcon />}
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size={"sm"}
                    onClick={() => setViewMode("list")}
                />
            </div>
            {viewMode === "grid" ? (
                <div className={"gap-md flex flex-wrap p-xs"}>
                    {filteredTemplates.map(template => (
                        <TemplateCard key={template.id} template={template} onSelect={onSelect} />
                    ))}
                </div>
            ) : (
                <div className={"flex flex-col gap-xs p-xs"}>
                    {filteredTemplates.map(template => (
                        <TemplateListItem
                            key={template.id}
                            template={template}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface TemplateCardProps {
    template: ITemplateVM;
    onSelect: (template: ITemplateVM) => void;
}

const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const icon = normalizeIcon(template.icon);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={
                "flex flex-col justify-between bg-neutral-base overflow-hidden rounded-lg w-[173px] relative shadow-sm"
            }
        >
            <div>
                <div className={"flex items-center justify-center py-xxl w-full bg-neutral-dimmed"}>
                    {icon ? (
                        <FontAwesomeIcon
                            className={"text-neutral-xstrong"}
                            icon={icon}
                            style={{ width: 40, height: 40 }}
                        />
                    ) : null}
                </div>
                <div className={"py-sm-extra px-md"}>
                    <Text size={"md"} className={"mb-xs text-neutral-primary font-semibold"}>
                        {template.label}
                    </Text>
                </div>
            </div>

            {isHovered && (
                <Dialog.Close asChild>
                    <div
                        className={
                            "absolute inset-0 flex items-center justify-center bg-white/80 cursor-pointer"
                        }
                        onClick={() => onSelect(template)}
                    >
                        <Button size={"lg"} variant={"primary"} icon={<PlusIcon />}>
                            Insert
                        </Button>
                    </div>
                </Dialog.Close>
            )}
        </div>
    );
};

interface TemplateListItemProps {
    template: ITemplateVM;
    onSelect: (template: ITemplateVM) => void;
}

const TemplateListItem = ({ template, onSelect }: TemplateListItemProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const icon = normalizeIcon(template.icon);

    return (
        <Dialog.Close asChild>
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => onSelect(template)}
                className={
                    "flex items-center gap-md p-sm rounded-lg bg-neutral-base hover:bg-neutral-dimmed cursor-pointer"
                }
            >
                <div
                    className={"flex items-center justify-center size-lg bg-neutral-dimmed rounded"}
                >
                    {icon ? (
                        <FontAwesomeIcon
                            className={"text-neutral-xstrong"}
                            icon={icon}
                            style={{ width: 20, height: 20 }}
                        />
                    ) : null}
                </div>
                <Text size={"md"} className={"flex-1 text-neutral-primary font-semibold"}>
                    {template.label}
                </Text>
                {isHovered && (
                    <Button size={"sm"} variant={"primary"} icon={<PlusIcon />}>
                        Insert
                    </Button>
                )}
            </div>
        </Dialog.Close>
    );
};
