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
import { useSnackbar } from "@webiny/app-admin";
import { Icon, IconButton, Text, DropdownMenu, Tag } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/components/editor/field");

const allowedTitleFieldTypes: string[] = ["text", "number"];

const isFieldAllowedToBeTitle = (model: CmsModel, field: CmsModelField, parent?: CmsModelField) => {
    if (field.list || parent) {
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
    if (field.list || parent) {
        return false;
    } else if (model.descriptionFieldId === field.fieldId) {
        return false;
    }
    return field.type === "long-text";
};

const isFieldAllowedToBeImage = (model: CmsModel, field: CmsModelField, parent?: CmsModelField) => {
    if (field.list || parent) {
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
    const { getFieldType, getFieldRenderer } = useModelFieldEditor();

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
        await removeFieldFromSelected();
        props.onDelete(field);
        return;
    }, [field.fieldId]);

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

    const fieldType = getFieldType(field.type);
    const editorFieldOptionPlugins =
        plugins.byType<CmsEditorFieldOptionPlugin>("cms-editor-field-option");

    if (!fieldType) {
        return null;
    }

    const renderer = getFieldRenderer(field.renderer.name);
    const canEdit = fieldType.canEditSettings !== false;

    const defaultInformationRenderer = useMemo(() => {
        const fieldTypeName = getFieldTypeName(model, field, parent);
        const fn = () => {
            if (!fieldTypeName) {
                return null;
            }
            return <Tag content={capitalize(fieldTypeName)} variant={"neutral-light"} />;
        };

        fn.displayName = "FieldTypeRenderer";

        return fn;
    }, [field.id]);

    const fieldInformationRenderer = fieldType.renderInfo;

    const info = [renderer?.name, field.list ? "multiple values" : null].filter(Boolean).join(", ");

    return (
        <Fragment>
            <div className={"flex items-center justify-between gap-sm-extra"}>
                <div className={"flex items-center gap-sm-extra flex-1 min-w-0"}>
                    <Icon
                        icon={fieldType.icon}
                        label={fieldType.label}
                        size={"md"}
                        color={"neutral-light"}
                    />
                    <div className={"flex flex-col gap-xxs min-w-0"}>
                        <span
                            className={
                                "text-md font-semibold text-neutral-primary truncate leading-5"
                            }
                        >
                            {field.label}
                        </span>
                        <Text size={"sm"} className={"text-neutral-muted truncate"}>
                            {fieldType.label}
                            {info && <span> / {info}</span>}
                        </Text>
                    </div>
                </div>
                <div className={"flex items-center justify-end gap-xs shrink-0"}>
                    {fieldInformationRenderer
                        ? fieldInformationRenderer({ model, field })
                        : defaultInformationRenderer()}
                    <DropdownMenu
                        trigger={
                            <IconButton icon={<MoreVerticalIcon />} variant={"ghost"} size={"sm"} />
                        }
                    >
                        {canEdit && (
                            <DropdownMenu.Item
                                onClick={() => onEdit(field)}
                                text={t`Edit`}
                                icon={
                                    <DropdownMenu.Item.Icon
                                        element={<EditIcon />}
                                        label={t`Edit field`}
                                    />
                                }
                            />
                        )}
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
                            className={"text-destructive-primary! [&_svg]:fill-destructive"}
                        />
                    </DropdownMenu>
                </div>
            </div>
            {fieldType.renderEditor && (
                <div className={"pt-md"}>{fieldType.renderEditor({ field, model })}</div>
            )}
        </Fragment>
    );
};

export default React.memo(Field);
