import React, { useState } from "react";
import { css } from "emotion";
import { useApolloClient } from "@apollo/react-hooks";
import set from "lodash/set";
import get from "lodash/get";
import cloneDeep from "lodash/cloneDeep";
import { Chips, Chip } from "@webiny/ui/Chips";
import { Tags as TagsComponent } from "@webiny/ui/Tags";
import { UPDATE_FILE, LIST_FILES, LIST_TAGS } from "./../graphql";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { useFileManager } from "./../FileManagerContext";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Form } from "@webiny/form";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Tags({ file }) {
    const client = useApolloClient();

    const [editing, setEdit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initialTags, setInitialTags] = useState(Array.isArray(file.tags) ? [...file.tags] : []);
    const { showSnackbar } = useSnackbar();
    const { queryParams } = useFileManager();

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
                    {editing ? (
                        <>
                            <Bind
                                name={"tags"}
                                beforeChange={(tags, baseOnChange) => {
                                    const formattedTags = tags.map(tag => tag.toLowerCase());
                                    baseOnChange(formattedTags);
                                }}
                            >
                                <TagsComponent
                                    disabled={saving}
                                    autoFocus
                                    placeholder={"Enter a tag and press enter"}
                                />
                            </Bind>
                            <div style={{ marginTop: "10px" }}>
                                <ButtonPrimary small onClick={submit}>
                                    Submit
                                </ButtonPrimary>{" "}
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
                        </>
                    ) : (
                        <>
                            {data.tags.length > 0 ? (
                                <Chips>
                                    {data.tags.map((tag, index) => (
                                        <Chip key={tag + index} label={tag} />
                                    ))}
                                </Chips>
                            ) : (
                                <div>No tags assigned.</div>
                            )}
                            <div className={style.editTag}>
                                <a onClick={() => setEdit(true)}>
                                    <EditIcon /> Edit
                                </a>
                            </div>
                        </>
                    )}
                </React.Fragment>
            )}
        </Form>
    );
}

export default Tags;
