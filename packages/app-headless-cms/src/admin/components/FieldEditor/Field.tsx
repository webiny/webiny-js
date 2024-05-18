import React, { Fragment, useCallback, useMemo } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { ReactComponent as TitleIcon } from "~/admin/icons/title-24px.svg";
import { ReactComponent as MoreVerticalIcon } from "~/admin/icons/more_vert.svg";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { plugins } from "@webiny/plugins";
import { CmsModelField, CmsEditorFieldOptionPlugin, CmsModel } from "~/types";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useModelEditor } from "~/admin/hooks";
import { useModelFieldEditor } from "~/admin/components/FieldEditor/useModelFieldEditor";
import { useConfirmationDialog } from "@webiny/app-admin";

const t = i18n.ns("app-headless-cms/admin/components/editor/field");

const FieldContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
});

const LowerCase = styled.span`
    text-transform: lowercase;
`;

const Info = styled("div")({
    display: "flex",
    flexDirection: "column",
    "> *": {
        flex: "1 100%",
        lineHeight: "150%"
    }
});

const Actions = styled("div")({
    display: "flex",
    flexDirection: "row",
    alignItems: "right",
    position: "relative",
    "> *": {
        flex: "1 100%"
    }
});

/**
 * TODO @sven to give correct values
 */
const FieldTypeName = styled("div")({
    fontFamily: "var(--mdc-typography-font-family)",
    display: "flex",
    flexDirection: "column",
    textTransform: "uppercase",
    color: "#938F99",
    flex: "1",
    textAlign: "right",
    fontSize: "14px",
    paddingRight: "10px"
});

const menuStyles = css({
    width: "220px",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const FieldExtra = styled.div`
    padding: 10px 0 10px;

    :empty {
        display: none;
    }
`;

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
    const { showSnackbar } = useSnackbar();
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
            return showSnackbar(response.error.message);
        }

        showSnackbar(t`Title field set successfully.`);
    }, [field.fieldId, setModel]);

    const setAsDescription = useCallback(async (): Promise<void> => {
        const response = await setModel(data => {
            return { ...data, descriptionFieldId: field.fieldId };
        });

        if (response && response.error) {
            return showSnackbar(response.error.message);
        }

        showSnackbar(t`Description field set successfully.`);
    }, [field.fieldId, setModel]);

    const setAsImage = useCallback(async (): Promise<void> => {
        const response = await setModel(data => {
            return { ...data, imageFieldId: field.fieldId };
        });

        if (response && response.error) {
            return showSnackbar(response.error.message);
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
            return <FieldTypeName>{fieldTypeName}</FieldTypeName>;
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
            <FieldContainer>
                <Info>
                    <Typography use={"subtitle1"}>{field.label}</Typography>
                    <Typography use={"caption"}>
                        {fieldPlugin.field.label}
                        {info && <LowerCase> ({info})</LowerCase>}
                    </Typography>
                </Info>
                {fieldInformationRenderer
                    ? fieldInformationRenderer({ model, field })
                    : defaultInformationRenderer()}
                <Actions>
                    {canEdit ? (
                        <IconButton
                            data-testid={"cms.editor.edit-field"}
                            icon={<EditIcon />}
                            onClick={() => onEdit(field)}
                        />
                    ) : null}
                    <Menu
                        className={menuStyles}
                        handle={<IconButton icon={<MoreVerticalIcon />} />}
                    >
                        {editorFieldOptionPlugins.map(pl =>
                            React.cloneElement(pl.render(), { key: pl.name })
                        )}
                        {/* We only allow this action for top-level fields. */}
                        <MenuItem
                            disabled={!isFieldAllowedToBeTitle(model, field, parent)}
                            onClick={setAsTitle}
                        >
                            <ListItemGraphic>
                                <Icon icon={<TitleIcon />} />
                            </ListItemGraphic>
                            {t`Use as title`}
                        </MenuItem>
                        <MenuItem
                            disabled={!isFieldAllowedToBeDescription(model, field, parent)}
                            onClick={setAsDescription}
                        >
                            <ListItemGraphic>
                                <Icon icon={<TitleIcon />} />
                            </ListItemGraphic>
                            {t`Use as description`}
                        </MenuItem>
                        <MenuItem
                            disabled={!isFieldAllowedToBeImage(model, field, parent)}
                            onClick={setAsImage}
                        >
                            <ListItemGraphic>
                                <Icon icon={<TitleIcon />} />
                            </ListItemGraphic>
                            {t`Use as image`}
                        </MenuItem>

                        <MenuItem onClick={onDelete}>
                            <ListItemGraphic>
                                <Icon icon={<DeleteIcon />} />
                            </ListItemGraphic>
                            {t`Delete`}
                        </MenuItem>
                    </Menu>
                </Actions>
            </FieldContainer>
            <FieldExtra>
                {fieldPlugin.field.render &&
                    fieldPlugin.field.render({ field, data: model, setData: setModel })}
            </FieldExtra>
        </Fragment>
    );
};

export default React.memo(Field);
