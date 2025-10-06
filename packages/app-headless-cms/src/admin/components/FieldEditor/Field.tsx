import React, { Fragment, useCallback, useMemo } from "react";
import capitalize from "lodash/capitalize.js";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as TitleIcon } from "@webiny/icons/title.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { plugins } from "@webiny/plugins";
import type { CmsModelField, CmsEditorFieldOptionPlugin, CmsModel } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { useModelFieldEditor } from "~/admin/components/FieldEditor/useModelFieldEditor.js";
import { useSnackbar, useConfirmationDialog } from "@webiny/app-admin";
import { IconButton, Heading, Text, DropdownMenu, Tag } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/components/editor/field");

const allowedTitleFieldTypes: string[] = ["text", "number"];

const isFieldAllowedToBeTitle = (model: CmsModel, field: CmsModelField, parent?: CmsModelField) => {
    if (field.multipleValues || parent) {
        return false;
    } else if (allowedTitleFieldTypes.includes(field.type) === false) {
        return false;
    } else if (model.titleFieldId === field.fieldId) {
        return false;
    }
    return true;
};
const isFieldAllowedToBeDescription = (
    model: CmsModel,
    field: CmsModelField,
    parent?: CmsModelField
) => {
    if (field.multipleValues || parent) {
        return false;
    } else if (model.descriptionFieldId === field.fieldId) {
        return false;
    }
    return field.type === "long-text";
};

const isFieldAllowedToBeImage = (model: CmsModel, field: CmsModelField, parent?: CmsModelField) => {
    if (field.multipleValues || parent) {
        return false;
    } else if (model.imageFieldId === field.fieldId) {
        return false;
    }
    return field.type === "file" && field.settings?.imagesOnly;
};

const getFieldTypeName = (
    model: CmsModel,
    field: CmsModelField,
    parent?: CmsModelField
): string | null => {
    if (parent) {
        return null;
    }
    const isTitleField = field.fieldId === model?.titleFieldId && !parent;
    const isDescriptionField = field.fieldId === model?.descriptionFieldId && !parent;
    const isImageField = field.fieldId === model?.imageFieldId && !parent;

    return (
        [
            isTitleField ? "entry title" : null,
            isDescriptionField ? "entry description" : null,
            isImageField ? "entry image" : null
        ]
            .filter(Boolean)
            .join("") || null
    );
};

export interface FieldProps {
    field: CmsModelField;
    onDelete: (field: CmsModelField) => void;
    onEdit: (field: CmsModelField) => void;
    parent?: CmsModelField;
}

const Field = (props: FieldProps) => {
    const { field, onEdit, parent } = props;
    const { showSnackbar, showErrorSnackbar } = useSnackbar();
    const { setData: setModel, data: model } = useModelEditor();
    const { getFieldPlugin, getFieldRendererPlugin } = useModelFieldEditor();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Warning - You are trying to delete a locked field!`,
        message: (
            <>
                <p>{t`You are about to delete a field which is used in the data storage`}</p>
                <p>{t`All data in that field will be lost and there is no going back!`}</p>
                <p>&nbsp;</p>
                <p>{t`Are you sure you want to continue?`}</p>
            </>
        )
    });
    const lockedFields = model?.lockedFields || [];
    const isLocked = lockedFields.some(lockedField => lockedField.fieldId === field.storageId);

    const removeFieldFromSelected = useCallback(async () => {
        if (model.titleFieldId === field.fieldId) {
            await setModel(data => {
                return {
                    ...data,
                    titleFieldId: null
                };
            });
        } else if (model.descriptionFieldId === field.fieldId) {
            await setModel(data => {
                return {
                    ...data,
                    descriptionFieldId: null
                };
            });
        } else if (model.imageFieldId === field.fieldId) {
            await setModel(data => {
                return {
                    ...data,
                    imageFieldId: null
                };
            });
        }
    }, [field.id, setModel, model]);

    const onDelete = useCallback(async () => {
        if (!isLocked) {
            await removeFieldFromSelected();
            props.onDelete(field);
            return;
        }
        showConfirmation(async () => {
            await removeFieldFromSelected();
            props.onDelete(field);
        });
    }, [field.fieldId, lockedFields]);

    const setAsTitle = useCallback(async (): Promise<void> => {
        const response = await setModel(data => {
            return { ...data, titleFieldId: field.fieldId };
        });

        if (response && response.error) {
            return showErrorSnackbar(response.error.message);
        }

        showSnackbar(t`Title field set successfully.`);
    }, [field.fieldId, setModel]);

    const setAsDescription = useCallback(async (): Promise<void> => {
        const response = await setModel(data => {
            return { ...data, descriptionFieldId: field.fieldId };
        });

        if (response && response.error) {
            return showErrorSnackbar(response.error.message);
        }

        showSnackbar(t`Description field set successfully.`);
    }, [field.fieldId, setModel]);

    const setAsImage = useCallback(async (): Promise<void> => {
        const response = await setModel(data => {
            return { ...data, imageFieldId: field.fieldId };
        });

        if (response && response.error) {
            return showErrorSnackbar(response.error.message);
        }

        showSnackbar(t`Image field set successfully.`);
    }, [field.fieldId, setModel]);

    const fieldPlugin = getFieldPlugin(field.type);
    const editorFieldOptionPlugins =
        plugins.byType<CmsEditorFieldOptionPlugin>("cms-editor-field-option");

    if (!fieldPlugin) {
        return null;
    }

    const rendererPlugin = getFieldRendererPlugin(field.renderer.name);
    const canEdit = fieldPlugin.field.canEditSettings !== false;

    const defaultInformationRenderer = useMemo(() => {
        const fieldTypeName = getFieldTypeName(model, field, parent);
        const fn = () => {
            if (!fieldTypeName) {
                return null;
            }
            return <Tag content={capitalize(fieldTypeName)} variant={"neutral-base"} />;
        };

        fn.displayName = "FieldTypeRenderer";

        return fn;
    }, [field.id]);

    const fieldInformationRenderer = fieldPlugin.field?.renderInfo;

    const info = [rendererPlugin?.renderer.name, field.multipleValues ? "multiple values" : null]
        .filter(Boolean)
        .join(", ");

    return (
        <Fragment>
            <div className={"wby-flex wby-justify-between wby-align-center"}>
                <div>
                    <Heading level={6}>{field.label}</Heading>
                    <Text size={"sm"} className={"wby-text-neutral-strong"}>
                        {fieldPlugin.field.label}
                        {info && <span className={"wby-lowercase"}> ({info})</span>}
                    </Text>
                </div>
                <div className={"wby-flex wby-items-center wby-justify-end wby-gap-sm"}>
                    {fieldInformationRenderer
                        ? fieldInformationRenderer({ model, field })
                        : defaultInformationRenderer()}
                    {canEdit ? (
                        <IconButton
                            data-testid={"cms.editor.edit-field"}
                            icon={<EditIcon />}
                            onClick={() => onEdit(field)}
                            variant={"ghost"}
                            size={"sm"}
                        />
                    ) : null}
                    <DropdownMenu
                        trigger={
                            <IconButton icon={<MoreVerticalIcon />} variant={"ghost"} size={"sm"} />
                        }
                    >
                        {editorFieldOptionPlugins.map(pl =>
                            React.cloneElement(pl.render(), { key: pl.name })
                        )}
                        {/* We only allow this action for top-level fields. */}
                        <DropdownMenu.Item
                            disabled={!isFieldAllowedToBeTitle(model, field, parent)}
                            onClick={setAsTitle}
                            text={t`Use as title`}
                            icon={
                                <DropdownMenu.Item.Icon
                                    element={<TitleIcon />}
                                    label={t`Use as title`}
                                />
                            }
                        />
                        <DropdownMenu.Item
                            disabled={!isFieldAllowedToBeDescription(model, field, parent)}
                            onClick={setAsDescription}
                            text={t`Use as description`}
                            icon={
                                <DropdownMenu.Item.Icon
                                    element={<TitleIcon />}
                                    label={t`Use as description`}
                                />
                            }
                        />
                        <DropdownMenu.Item
                            disabled={!isFieldAllowedToBeImage(model, field, parent)}
                            onClick={setAsImage}
                            text={t`Use as image`}
                            icon={
                                <DropdownMenu.Item.Icon
                                    element={<TitleIcon />}
                                    label={t`Use as image`}
                                />
                            }
                        />
                        <DropdownMenu.Item
                            onClick={onDelete}
                            text={t`Delete`}
                            icon={
                                <DropdownMenu.Item.Icon
                                    element={<DeleteIcon />}
                                    label={t`Delete`}
                                />
                            }
                            className={"!wby-text-destructive-primary [&_svg]:wby-fill-destructive"}
                        />
                    </DropdownMenu>
                </div>
            </div>
            {fieldPlugin.field.render && (
                <div className={"wby-pt-md"}>
                    {fieldPlugin.field.render({ field, data: model, setData: setModel })}
                </div>
            )}
        </Fragment>
    );
};

export default React.memo(Field);
