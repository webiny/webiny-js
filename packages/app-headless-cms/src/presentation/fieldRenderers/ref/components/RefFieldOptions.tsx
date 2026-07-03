import React, { useCallback } from "react";
import type { CmsModel } from "~/types.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { Button, DropdownMenu, Text, Icon } from "@webiny/admin-ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { normalizeIcon } from "~/utils/normalizeIcon.js";
import { observer } from "mobx-react-lite";

interface ModelListItemProps {
    model: Pick<CmsModel, "modelId" | "name" | "description" | "icon">;
    onClick: (modelId: string) => void;
}

const ModelListItem = ({ model, onClick: originalOnClick }: ModelListItemProps) => {
    const onClick = useCallback(() => {
        originalOnClick(model.modelId);
    }, [originalOnClick]);

    const icon = model.icon ? (
        <Icon
            icon={<FontAwesomeIcon icon={normalizeIcon(model.icon) as IconProp} />}
            label={"Model icon"}
            size={"lg"}
            className={"text-neutral-strong"}
        />
    ) : undefined;

    return (
        <DropdownMenu.Item
            onClick={onClick}
            icon={icon}
            text={
                <div>
                    <Text as={"div"}>{model.name}</Text>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        {model.description}
                    </Text>
                </div>
            }
        />
    );
};

interface RefFieldOptionsProps {
    models: CmsModel[];
    onNewRecord: (modelId: string) => void;
    onLinkExistingRecord: (modelId: string) => void;
}

export const RefFieldOptions = observer(
    ({ models, onNewRecord, onLinkExistingRecord }: RefFieldOptionsProps) => {
        const hasMultipleModels = models.length > 1;

        const onSingleNewRecord = useCallback(() => {
            if (models.length === 0 || hasMultipleModels) {
                return;
            }
            onNewRecord(models[0].modelId);
        }, [models]);

        const onSingleExistingRecord = useCallback(() => {
            if (models.length === 0 || hasMultipleModels) {
                return;
            }
            onLinkExistingRecord(models[0].modelId);
        }, [models]);

        if (hasMultipleModels) {
            return (
                <div className={"flex flex-wrap gap-sm"}>
                    <DropdownMenu
                        trigger={
                            <Button
                                variant={"tertiary"}
                                text="Create a new record"
                                icon={<AddIcon />}
                            />
                        }
                    >
                        {models.map(model => (
                            <ModelListItem
                                key={model.modelId}
                                onClick={onNewRecord}
                                model={model}
                            />
                        ))}
                    </DropdownMenu>
                    <DropdownMenu
                        trigger={
                            <Button
                                variant={"tertiary"}
                                text="Select an existing record"
                                icon={<LinkIcon />}
                            />
                        }
                    >
                        {models.map(model => (
                            <ModelListItem
                                key={model.modelId}
                                onClick={onLinkExistingRecord}
                                model={model}
                            />
                        ))}
                    </DropdownMenu>
                </div>
            );
        }

        return (
            <div className={"flex flex-wrap gap-sm"}>
                <Button
                    variant={"tertiary"}
                    text="Create a new record"
                    icon={<AddIcon />}
                    onClick={onSingleNewRecord}
                />
                <Button
                    variant={"tertiary"}
                    text="Select an existing record"
                    icon={<LinkIcon />}
                    onClick={onSingleExistingRecord}
                />
            </div>
        );
    }
);
