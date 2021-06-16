import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "~/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { ReactComponent as TitleIcon } from "~/admin/icons/title-24px.svg";
import { ReactComponent as MoreVerticalIcon } from "~/admin/icons/more_vert.svg";
import { useContentModelEditor } from "../../Context";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { plugins } from "@webiny/plugins";
import { CmsEditorField, CmsEditorFieldOptionPlugin } from "~/types";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

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

const allowedTitleFieldTypes = ["text", "number"];

const isFieldAllowedToBeTitle = (field: CmsEditorField) => {
    if (field.multipleValues) {
        return false;
    } else if (allowedTitleFieldTypes.includes(field.type) === false) {
        return false;
    }
    return true;
};

const Field = props => {
    const { field, onEdit, onDelete } = props;
    const { showSnackbar } = useSnackbar();
    const { getFieldPlugin, setData, data } = useContentModelEditor();

    const fieldPlugin = getFieldPlugin({ type: field.type });
    const editorFieldOptionPlugins = plugins.byType<CmsEditorFieldOptionPlugin>(
        "cms-editor-field-option"
    );

    const lockedFields = data.lockedFields || [];
    return (
        <FieldContainer data-testid={`cms.editor.field-row`}>
            <Info>
                <Typography use={"subtitle1"}>{field.label}</Typography>
                <Typography use={"caption"}>
                    {fieldPlugin && fieldPlugin.field.label}{" "}
                    {field.multipleValues && <>({t`multiple values`})</>}
                    {field.fieldId === data.titleFieldId && <>({t`entry title`})</>}
                </Typography>
            </Info>
            <Actions>
                <IconButton
                    icon={<EditIcon />}
                    onClick={() => onEdit(field)}
                    data-testid={"cms.editor.edit-field"}
                />
                <Menu className={menuStyles} handle={<IconButton icon={<MoreVerticalIcon />} />}>
                    {editorFieldOptionPlugins.map(pl =>
                        React.cloneElement(pl.render(), { key: pl.name })
                    )}
                    <MenuItem
                        disabled={!isFieldAllowedToBeTitle(field)}
                        onClick={async () => {
                            const response = await setData(data => {
                                data.titleFieldId = field.fieldId;
                                return data;
                            });

                            if (response.error) {
                                return showSnackbar(response.error.message);
                            }

                            showSnackbar(t`Title field set successfully.`);
                        }}
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
                        onClick={() => onDelete(field)}
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
    );
};

export default Field;
