import React, { Fragment, useCallback } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "~/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { ReactComponent as TitleIcon } from "~/admin/icons/title-24px.svg";
import { ReactComponent as MoreVerticalIcon } from "~/admin/icons/more_vert.svg";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { plugins } from "@webiny/plugins";
import { CmsEditorField, CmsEditorFieldOptionPlugin } from "~/types";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useContentModelEditor } from "~/admin/components/ContentModelEditor/useContentModelEditor";
import { useFieldEditor } from "~/admin/components/FieldEditor/useFieldEditor";

const t = i18n.ns("app-headless-cms/admin/components/editor/field");

const FieldContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
});

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
    "> *": {
        flex: "1 100%"
    }
});

const menuStyles = css({
    width: 220,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const allowedTitleFieldTypes: string[] = ["text", "number"];

const isFieldAllowedToBeTitle = (field: CmsEditorField, parent?: CmsEditorField) => {
    if (field.multipleValues || parent) {
        return false;
    } else if (allowedTitleFieldTypes.includes(field.type) === false) {
        return false;
    }
    return true;
};

export interface FieldProps {
    field: CmsEditorField;
    onDelete: (field: CmsEditorField) => void;
    onEdit: (field: CmsEditorField) => void;
    parent?: CmsEditorField;
}
const Field: React.FC<FieldProps> = props => {
    const { field, onEdit, parent } = props;
    const { showSnackbar } = useSnackbar();
    const { setData, data } = useContentModelEditor();
    const { getFieldPlugin } = useFieldEditor();

    const onDelete = useCallback(() => {
        props.onDelete(field);
    }, [field.fieldId]);

    const setAsTitle = useCallback(async (): Promise<void> => {
        const response = await setData(data => {
            return { ...data, titleFieldId: field.fieldId };
        });

        if (response && response.error) {
            return showSnackbar(response.error.message);
        }

        showSnackbar(t`Title field set successfully.`);
    }, [field.fieldId]);

    const fieldPlugin = getFieldPlugin(field.type);
    const editorFieldOptionPlugins =
        plugins.byType<CmsEditorFieldOptionPlugin>("cms-editor-field-option");

    if (!fieldPlugin) {
        return null;
    }

    const isTitleField = data && field.fieldId === data.titleFieldId && !parent;

    const lockedFields = data ? data.lockedFields || [] : [];
    return (
        <Fragment>
            <FieldContainer>
                <Info>
                    <Typography use={"subtitle1"}>{field.label}</Typography>
                    <Typography use={"caption"}>
                        {fieldPlugin.field.label}{" "}
                        {field.multipleValues && <>({t`multiple values`})</>}
                        {isTitleField && <>({t`entry title`})</>}
                    </Typography>
                </Info>
                <Actions>
                    <IconButton
                        data-testid={"cms.editor.edit-field"}
                        icon={<EditIcon />}
                        onClick={() => onEdit(field)}
                    />
                    <Menu
                        className={menuStyles}
                        handle={<IconButton icon={<MoreVerticalIcon />} />}
                    >
                        {editorFieldOptionPlugins.map(pl =>
                            React.cloneElement(pl.render(), { key: pl.name })
                        )}
                        {/* We only allow this action for top-level fields. */}
                        <MenuItem
                            disabled={!isFieldAllowedToBeTitle(field, parent)}
                            onClick={setAsTitle}
                        >
                            <ListItemGraphic>
                                <Icon icon={<TitleIcon />} />
                            </ListItemGraphic>
                            {t`Use as title`}
                        </MenuItem>
                        <MenuItem
                            disabled={lockedFields.some(
                                lockedField => lockedField.fieldId === field.fieldId
                            )}
                            onClick={onDelete}
                        >
                            <ListItemGraphic>
                                <Icon icon={<DeleteIcon />} />
                            </ListItemGraphic>
                            {lockedFields.find(lockedField => lockedField.fieldId === field.fieldId)
                                ? t`Cannot delete`
                                : t`Delete`}
                        </MenuItem>
                    </Menu>
                </Actions>
            </FieldContainer>
            <div className={"field-extra"}>
                {fieldPlugin.field.render && fieldPlugin.field.render({ field, data, setData })}
            </div>
        </Fragment>
    );
};

export default React.memo(Field);
