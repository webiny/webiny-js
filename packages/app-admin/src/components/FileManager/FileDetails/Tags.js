// @flow
/* eslint-disable */
import React, { useState } from "react";
import { css } from "emotion";
import { useApolloClient } from "react-apollo";
import { get, cloneDeep } from "lodash";
import { Chips, Chip } from "@webiny/ui/Chips";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Tags as TagsComponent } from "@webiny/ui/Tags";
import { Form } from "@webiny/form";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { UPDATE_FILE_BY_SRC, LIST_FILES, LIST_TAGS } from "./../graphql";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { useFileManager } from "./../FileManagerContext";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Tags({ file }) {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const [editing, setEdit] = useState(false);
    const initialTags = Array.isArray(file.tags) ? [...file.tags] : [];

    const { queryParams } = useFileManager();

    if (editing) {
        return (
            <Form
                data={{ tags: [...initialTags] }}
                onSubmit={async ({ tags }) => {
                    setEdit(false);
                    await client.mutate({
                        mutation: UPDATE_FILE_BY_SRC,
                        variables: {
                            src: file.src,
                            data: { tags }
                        },
                        refetchQueries: [{ query: LIST_TAGS }],
                        update: (cache, updated) => {
                            const newFileData = get(updated, "data.files.updateFileBySrc.data");

                            // 1. Update files list cache
                            let data = cloneDeep(
                                cache.readQuery({
                                    query: LIST_FILES,
                                    variables: queryParams
                                })
                            );

                            data.files.listFiles.data.forEach(item => {
                                if (item.src === newFileData.src) {
                                    item.tags = newFileData.tags;
                                }
                            });

                            cache.writeQuery({
                                query: LIST_FILES,
                                variables: queryParams,
                                data
                            });
                        }
                    });

                    showSnackbar("Tags successfully updated.");
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        <Bind name={"tags"}>
                            {({ value, onChange }) => (
                                <TagsComponent
                                    value={value}
                                    onChange={tags => onChange(tags.map(tag => tag.toLowerCase()))}
                                    autoFocus
                                    placeholder={"Enter a tag and press enter"}
                                />
                            )}
                        </Bind>
                        <div style={{ marginTop: "10px" }}>
                            <ButtonPrimary small onClick={submit}>
                                Submit
                            </ButtonPrimary>{" "}
                            <ButtonSecondary small onClick={() => setEdit(false)}>
                                Cancel
                            </ButtonSecondary>
                        </div>
                    </>
                )}
            </Form>
        );
    }

    return (
        <>
            {initialTags.length > 0 ? (
                <Chips>
                    {initialTags.map((tag, index) => (
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
    );
}

export default Tags;
