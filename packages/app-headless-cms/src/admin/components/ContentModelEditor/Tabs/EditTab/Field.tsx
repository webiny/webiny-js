import React from "react";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "@webiny/app-headless-cms/admin/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/delete.svg";
import { ReactComponent as TitleIcon } from "@webiny/app-headless-cms/admin/icons/title-24px.svg";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-headless-cms/admin/icons/more_vert.svg";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { getPlugins } from "@webiny/plugins";
import { CmsEditorFieldOptionPlugin } from "@webiny/app-headless-cms/types";
import { css } from "emotion";
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

const Field = props => {
    const { field, onEdit, onDelete } = props;
    const { getValue } = useI18N();
    const { showSnackbar } = useSnackbar();
    const { getFieldPlugin, setData, data } = useContentModelEditor();

    const fieldPlugin = getFieldPlugin({ type: field.type });
    const plugins = getPlugins<CmsEditorFieldOptionPlugin>("cms-editor-field-option");

    const lockedFields = data.lockedFields || [];
    return (
        <FieldContainer>
            <Info>
                <Typography use={"subtitle1"}>{getValue(field.label)} </Typography>
                <Typography use={"caption"}>
                    {fieldPlugin && fieldPlugin.field.label}{" "}
                    {field.multipleValues && <>({t`multiple values`})</>}
                    {field.fieldId === data.titleFieldId && <>({t`entry title`})</>}
                </Typography>
            </Info>
            <Actions>
                <IconButton icon={<EditIcon />} onClick={() => onEdit(field)} />
                <Menu className={menuStyles} handle={<IconButton icon={<MoreVerticalIcon />} />}>
                    {plugins.map(pl => React.cloneElement(pl.render(), { key: pl.name }))}
                    <MenuItem
                        disabled={field.multipleValues || field.type !== "text"}
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
                        disabled={lockedFields.find(lockedField => lockedField.fieldId === field.fieldId)}
                        onClick={() => onDelete(field)}
                    >
                        <ListItemGraphic>
                            <Icon icon={<DeleteIcon />} />
                        </ListItemGraphic>
                        {lockedFields.find(lockedField => lockedField.fieldId === field.fieldId) ? t`Cannot delete` : t`Delete`}
                    </MenuItem>
                </Menu>
            </Actions>
        </FieldContainer>
    );
};

export default Field;
