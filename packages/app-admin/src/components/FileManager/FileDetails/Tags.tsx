import React, { useCallback, useState } from "react";
import classNames from "classnames";
import { css } from "emotion";
import { useApolloClient, useQuery } from "@apollo/react-hooks";
import set from "lodash/set";
import get from "lodash/get";
import cloneDeep from "lodash/cloneDeep";
import { Chips, Chip } from "@webiny/ui/Chips";
import { ButtonSecondary, ButtonPrimary, ButtonDefault, IconButton } from "@webiny/ui/Button";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { Icon } from "@webiny/ui/Icon";
import { Form } from "@webiny/form";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { useFileManager } from "./../FileManagerContext";
import { UPDATE_FILE, LIST_FILES, LIST_TAGS } from "./../graphql";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { ReactComponent as LabelIcon } from "./../icons/round-label-24px.svg";

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

function Tags({ file, canEdit }) {
    const client = useApolloClient();

    const [editing, setEdit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initialTags, setInitialTags] = useState(Array.isArray(file.tags) ? [...file.tags] : []);
    const { showSnackbar } = useSnackbar();
    const { queryParams } = useFileManager();
    const handleEdit = useCallback(() => setEdit(true), []);
    const listTagsQuery = useQuery(LIST_TAGS);
    const allTags = get(listTagsQuery, "data.fileManager.listTags") || [];

    const isEditingAllowed = canEdit(file);

    const renderHeaderContent = useCallback(
        ({ data }) => {
            if (editing) {
                return null;
            }
            const hasTags = data.tags.length > 0;

            if (hasTags) {
                // Render existing tags and "edit tags" action.
                return (
                    <>
                        <Chips className={classNames("list-item__content", chipsStyle)}>
                            {data.tags.map((tag, index) => {
                                const label = typeof tag === "string" ? tag : tag.name;
                                return <Chip key={label + index} label={label} />;
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
                >
                    Add tags...
                </ButtonDefault>
            );
        },
        [editing, isEditingAllowed]
    );

    return (
        <Form
            data={{
                tags: initialTags
            }}
            onSubmit={async ({ tags }) => {
                setSaving(true);
                client
                    .mutate({
                        mutation: UPDATE_FILE,
                        variables: {
                            id: file.id,
                            data: { tags }
                        },
                        update: (cache, updated) => {
                            const newFileData = get(updated, "data.fileManager.updateFile.data");

                            // 1. Update files list cache
                            const data: any = cloneDeep(
                                cache.readQuery({
                                    query: LIST_FILES,
                                    variables: queryParams
                                })
                            );

                            data.fileManager.listFiles.data.forEach(item => {
                                if (item.key === newFileData.key) {
                                    item.tags = newFileData.tags;
                                }
                            });

                            cache.writeQuery({
                                query: LIST_FILES,
                                variables: queryParams,
                                data
                            });
                            // 2. Update "LIST_TAGS" cache
                            if (Array.isArray(newFileData.tags)) {
                                // Get list tags data
                                const listTagsData: any = cloneDeep(
                                    cache.readQuery({
                                        query: LIST_TAGS
                                    })
                                );
                                // Add new tag in list
                                const updatedTagsList = [...newFileData.tags];

                                if (Array.isArray(listTagsData.fileManager.listTags)) {
                                    listTagsData.fileManager.listTags.forEach(tag => {
                                        if (!updatedTagsList.includes(tag)) {
                                            updatedTagsList.push(tag);
                                        }
                                    });
                                }

                                set(listTagsData, "fileManager.listTags", updatedTagsList);
                                // Write it to cache
                                cache.writeQuery({
                                    query: LIST_TAGS,
                                    data: listTagsData
                                });
                            }
                        }
                    })
                    .then(() => {
                        setInitialTags(tags);
                        setSaving(false);
                        setEdit(false);
                        showSnackbar("Tags successfully updated.");
                    });
            }}
        >
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
                                beforeChange={(tags, baseOnChange) => {
                                    const formattedTags = tags.map(tag => tag.toLowerCase());
                                    baseOnChange(formattedTags);
                                }}
                            >
                                <MultiAutoComplete
                                    options={allTags}
                                    placeholder={"homepage asset"}
                                    description={"Type in a new tag or select an existing one."}
                                    unique={true}
                                    allowFreeInput={true}
                                    useSimpleValues={true}
                                    disabled={saving}
                                />
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
}

export default Tags;
