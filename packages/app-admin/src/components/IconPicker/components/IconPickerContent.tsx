import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Button, Icon, OverlayLoader, Tabs } from "@webiny/admin-ui";
import { IconTypeProvider } from "~/components/IconPicker/config/IconType.js";
import { IconPickerTabRenderer } from "~/components/IconPicker/IconPickerTab.js";
import type { IconType } from "~/components/IconPicker/config/index.js";

interface IconPickerContentProps {
    loading?: boolean;
    iconTypes: IconType[];
    activeTab?: string;
    removeIcon: () => void;
    removable?: boolean;
}

const IconPickerContent = ({
    activeTab,
    iconTypes,
    loading,
    removeIcon,
    removable
}: IconPickerContentProps) => {
    return (
        <div className={"relative"}>
            {loading && <OverlayLoader size={"sm"} />}
            <Tabs
                size={"sm"}
                spacing={"sm"}
                defaultValue={activeTab}
                separator={true}
                tabs={iconTypes.map(iconType => (
                    <IconTypeProvider key={iconType.name} type={iconType.name}>
                        <IconPickerTabRenderer />
                    </IconTypeProvider>
                ))}
            />
            {removable && (
                <div
                    className={
                        "flex flex-col px-sm py-sm border-solid border-t-sm border-neutral-muted"
                    }
                >
                    <Button
                        size={"md"}
                        variant={"secondary"}
                        text={"Remove"}
                        icon={<Icon icon={<DeleteIcon />} label={"Remove"} />}
                        onClick={removeIcon}
                    />
                </div>
            )}
        </div>
    );
};

export { IconPickerContent, type IconPickerContentProps };
