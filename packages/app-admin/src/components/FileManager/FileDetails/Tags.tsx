import React, { useCallback, useState } from "react";
import classNames from "classnames";
import { css } from "emotion";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { Chips, Chip } from "@webiny/ui/Chips";
import { ButtonSecondary, ButtonPrimary, ButtonDefault, IconButton } from "@webiny/ui/Button";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { Icon } from "@webiny/ui/Icon";
import { Form, FormOnSubmit } from "@webiny/form";
import { useSnackbar } from "~/hooks/useSnackbar";
import { getWhere, useFileManager } from "./../FileManagerContext";
import { LIST_TAGS } from "./../graphql";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as LabelIcon } from "@material-design-icons/svg/outlined/label.svg";
import { FileItem } from "../types";

const SCOPE_SEPARATOR = ":";

export const formatTagAsLabel = (tag: string, scope: string | undefined) => {
    if (!scope) {
        return tag;
    }
    return tag.replace(`${scope}${SCOPE_SEPARATOR}`, "");
};

export const tagWithoutScopePrefix = (tags: string[], scope: string) => {
    return tags.filter(tag => tag !== scope).map(tag => formatTagAsLabel(tag, scope));
};

const chipsStyle = css({
    "&.mdc-chip-set": {
        padding: 0,
        marginLeft: -4,
        "& .mdc-chip": {
            backgroundColor: "var(--mdc-theme-background)"
        }
    }
});
const iconButtonStyle = css({
    "&.mdc-icon-button svg": {
        width: 20,
        height: 20
    }
});
const addTagsStyle = css({
    "&.mdc-button:not(:disabled)": {
        color: "var(--mdc-theme-text-secondary-on-background)",
        textTransform: "capitalize",
        letterSpacing: "initial",
        marginLeft: -8
    }
});
const actionWrapperStyle = css({
    marginTop: 16,
    "& button:first-child": {
        marginRight: 16
    }
});

interface TagsProps {
    file: FileItem;
}

interface TagsFormData {
    tags: string[];
}

const Tags: React.FC<TagsProps> = ({ file }) => {
    const [editing, setEdit] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [initialTags, setInitialTags] = useState(Array.isArray(file.tags) ? [...file.tags] : []);
    const { showSnackbar } = useSnackbar();
    const { queryParams, updateFile, canEdit } = useFileManager();
    const handleEdit = useCallback(() => setEdit(true), []);
    const listTagsQuery = useQuery(LIST_TAGS, {
        variables: { where: getWhere(queryParams.scope) }
    });
    const listTags = get(listTagsQuery, "data.fileManager.listTags", []);
    const allTags = tagWithoutScopePrefix(listTags, queryParams.scope || "");

    const isEditingAllowed = canEdit(file);

    const renderHeaderContent = useCallback(
        ({ data }: { data: TagsFormData }) => {
            if (editing) {
                return null;
            }
            const hasTags = data.tags.length > 0;

            if (hasTags) {
                // Render existing tags and "edit tags" action.
                return (
                    <>
                        <Chips className={classNames("list-item__content", chipsStyle)}>
                            {data.tags
                                .filter(tag => tag !== queryParams.scope)
                                .map((tag, index) => {
                                    return (
                                        <Chip
                                            key={tag + index}
                                            label={formatTagAsLabel(tag, queryParams.scope)}
                                        />
                                    );
                                })}
                        </Chips>
                        {isEditingAllowed && (
                            <IconButton
                                className={iconButtonStyle}
                                icon={<EditIcon />}
                                onClick={handleEdit}
                            />
                        )}
                    </>
                );
            }
            // Render "add tags" action.
            return (
                <ButtonDefault
                    className={addTagsStyle}
                    onClick={handleEdit}
                    disabled={!isEditingAllowed}
                    data-testid="fm.tags.add"
                >
                    Add tags...
                </ButtonDefault>
            );
        },
        [editing, isEditingAllowed]
    );

    const onSubmit: FormOnSubmit<TagsFormData> = async ({ tags }) => {
        setUpdating(true);
        await updateFile(file.id, { tags });
        setUpdating(false);
        setInitialTags(tags);
        setEdit(false);
        showSnackbar("Tags successfully updated.");
    };

    return (
        <Form<TagsFormData> data={{ tags: initialTags }} onSubmit={onSubmit}>
            {({ Bind, data, setValue, submit }) => (
                <React.Fragment>
                    <li-title>
                        <Icon className={"list-item__icon"} icon={<LabelIcon />} />
                        {renderHeaderContent({ data })}
                    </li-title>
                    {editing && (
                        <li-content>
                            <Bind
                                name={"tags"}
                                beforeChange={(
                                    tags: TagsFormData["tags"],
                                    baseOnChange: (tags: TagsFormData["tags"]) => void
                                ) => {
                                    const formattedTags = tags.map(tag => {
                                        const tagInLowerCase = tag.toLowerCase();
                                        /**
                                         * If "scope" exists, prefix tag with "scope" if not already.
                                         */
                                        if (
                                            queryParams.scope &&
                                            !tagInLowerCase.startsWith(queryParams.scope)
                                        ) {
                                            return `${queryParams.scope}${SCOPE_SEPARATOR}${tagInLowerCase}`;
                                        }
                                        return tagInLowerCase;
                                    });
                                    baseOnChange(formattedTags);
                                }}
                            >
                                {({ value, ...bindProps }) => (
                                    <MultiAutoComplete
                                        {...bindProps}
                                        value={tagWithoutScopePrefix(
                                            value,
                                            queryParams.scope || ""
                                        )}
                                        options={allTags}
                                        placeholder={"homepage asset"}
                                        description={"Type in a new tag or select an existing one."}
                                        unique={true}
                                        allowFreeInput={true}
                                        useSimpleValues={true}
                                        disabled={updating}
                                    />
                                )}
                            </Bind>
                            <div className={actionWrapperStyle}>
                                <ButtonPrimary
                                    small
                                    onClick={submit}
                                    data-testid={"fm.tags.submit"}
                                >
                                    Submit
                                </ButtonPrimary>
                                <ButtonSecondary
                                    small
                                    onClick={() => {
                                        setValue("tags", initialTags);
                                        setEdit(false);
                                    }}
                                >
                                    Cancel
                                </ButtonSecondary>
                            </div>
                        </li-content>
                    )}
                </React.Fragment>
            )}
        </Form>
    );
};

export default Tags;
