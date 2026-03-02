import React from "react";
import type { CmsBaseLayoutDescriptor } from "webiny/admin/cms/model";
import type { CmsLayoutDescriptor } from "webiny/admin/cms/model";
import { PermissionsTab } from "webiny/admin/cms/model";
import { ReactComponent as EditIcon } from "webiny/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/delete.svg";
import { Grid, Heading, IconButton, Input, Tabs, Text } from "webiny/admin/ui";
import { useDialogs } from "webiny/admin/ui";
import { Bind } from "webiny/admin/form";

export interface PanoramaDescriptor extends CmsBaseLayoutDescriptor {
    type: "panorama";
    label: string;
    imageFieldPath: string;
}

const PanoramaSettings = () => {
    return (
        <Grid className={"mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"label"}>
                    <Input label={"Label"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"imageFieldPath"}>
                    <Input
                        label={"Image Field Path"}
                        description={
                            "The dot-notation path to the image field (e.g., panorama.image)"
                        }
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const PanoramaDialogContent = () => {
    return (
        <Tabs
            size={"md"}
            separator
            tabs={[
                <Tabs.Tab
                    key={"panorama"}
                    trigger={"Panorama"}
                    value={"panorama"}
                    content={<PanoramaSettings />}
                />,
                <Tabs.Tab
                    key={"permissions"}
                    trigger={"Permissions"}
                    value={"permissions"}
                    content={<PermissionsTab gridClassName={"mt-md"} />}
                />
            ]}
        />
    );
};

interface PanoramaLayoutEditorProps {
    descriptor: PanoramaDescriptor;
    onUpdate: (d: CmsLayoutDescriptor) => void;
    onDelete: () => void;
}

export const PanoramaLayoutEditor = ({
    descriptor,
    onUpdate,
    onDelete
}: PanoramaLayoutEditorProps) => {
    const dialogs = useDialogs();

    const openSettings = () => {
        dialogs.showDialog({
            title: "Panorama Settings",
            description: "Configure the panorama viewer and access permissions",
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            formData: {
                label: descriptor.label,
                imageFieldPath: descriptor.imageFieldPath ?? "",
                rules: descriptor.rules ?? []
            },
            content: <PanoramaDialogContent />,
            onAccept: data => {
                onUpdate({
                    ...descriptor,
                    label: data.label ?? "",
                    imageFieldPath: data.imageFieldPath ?? "",
                    rules: data.rules ?? []
                } as unknown as CmsLayoutDescriptor);
            }
        });
    };

    return (
        <div className={"flex items-center gap-sm"}>
            <div className={"flex-1"}>
                <Heading level={6}>{descriptor.label}</Heading>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    Image: {descriptor.imageFieldPath || "(not configured)"}
                </Text>
            </div>
            <div className={"flex items-center gap-xs"}>
                <IconButton
                    icon={<EditIcon />}
                    onClick={openSettings}
                    variant={"ghost"}
                    size={"sm"}
                />
                <IconButton
                    icon={<DeleteIcon />}
                    onClick={onDelete}
                    variant={"ghost"}
                    size={"sm"}
                />
            </div>
        </div>
    );
};
