import React, { useState } from "react";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, DelayedOnChange, Dialog, Icon, Input, Text, ToggleGroup } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as PlusIcon } from "@webiny/icons/add_circle_outline.svg";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";
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
    label,
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

type ViewMode = "grid" | "list";

const TemplateGallery = ({ templates, onSelect }: TemplateGalleryProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [search, setSearch] = useState("");

    const query = search.toLowerCase();
    const filteredTemplates = templates.filter(template =>
        template.label.toLowerCase().includes(query)
    );

    return (
        <>
            <div className={"flex items-center gap-sm pb-md pt-xs"}>
                <div className={"flex-1 min-w-0"}>
                    <DelayedOnChange value={search} onChange={setSearch}>
                        {({ value, onChange }) => (
                            <Input
                                autoFocus={true}
                                value={value}
                                onChange={onChange}
                                placeholder={"Search templates..."}
                                startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                                size={"md"}
                                variant={"primary"}
                            />
                        )}
                    </DelayedOnChange>
                </div>
                <div className={"shrink-0"}>
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onChange={value => setViewMode(value as ViewMode)}
                        items={[
                            { id: "grid", value: "grid", icon: <GridIcon /> },
                            { id: "list", value: "list", icon: <ListIcon /> }
                        ]}
                        variant="ghost"
                    />
                </div>
            </div>
            {viewMode === "grid" ? (
                <div className={"gap-md flex flex-wrap p-xs mb-xs"}>
                    {filteredTemplates.map(template => (
                        <TemplateCard key={template.id} template={template} onSelect={onSelect} />
                    ))}
                </div>
            ) : (
                <div className={"flex flex-col gap-y-sm mb-xs"}>
                    {filteredTemplates.map(template => (
                        <TemplateListItem
                            key={template.id}
                            template={template}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </>
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
                    {template.description && (
                        <Text size={"sm"} as={"div"} className={"text-neutral-muted"}>
                            {template.description}
                        </Text>
                    )}
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

// Used #f1f2f4 b/c in Figma, the color was result of multiple colors combined.
const TemplateListItem = ({ template, onSelect }: TemplateListItemProps) => {
    const icon = normalizeIcon(template.icon);

    return (
        <Dialog.Close asChild>
            <div
                onClick={() => onSelect(template)}
                className={
                    "group flex items-center gap-y-md py-sm-extra px-md rounded-lg bg-neutral-light hover:bg-[#f1f2f4] cursor-pointer"
                }
            >
                <div className={"flex items-center justify-center shrink-0 pr-md"}>
                    {icon ? (
                        <FontAwesomeIcon
                            className={"text-neutral-xstrong"}
                            icon={icon}
                            style={{ width: 24, height: 24 }}
                        />
                    ) : null}
                </div>
                <div className={"flex-1 min-w-0"}>
                    <Text size={"md"} className={"text-neutral-primary font-semibold truncate"}>
                        {template.label}
                    </Text>
                    {template.description && (
                        <Text size={"sm"} as={"div"} className={"text-neutral-muted truncate"}>
                            {template.description}
                        </Text>
                    )}
                </div>
                <div className={"hidden group-hover:block"}>
                    <Button size={"md"} variant={"primary"} icon={<PlusIcon />}>
                        Insert
                    </Button>
                </div>
            </div>
        </Dialog.Close>
    );
};
