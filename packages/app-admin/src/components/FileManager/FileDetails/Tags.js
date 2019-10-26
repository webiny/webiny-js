// @flow
/* eslint-disable */
import React, { useState } from "react";
import { css } from "emotion";
import { useApolloClient } from "react-apollo";
import { get, cloneDeep } from "lodash";
import { Chips, Chip } from "@webiny/ui/Chips";
import { Tags as TagsComponent } from "@webiny/ui/Tags";
import { UPDATE_FILE_BY_SRC, LIST_FILES, LIST_TAGS } from "./../graphql";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { useFileManager } from "./../FileManagerContext";
import { Hotkeys } from "react-hotkeyz";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

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
    const initialTags = Array.isArray(file.tags) ? [...file.tags] : [];
    const [currentTags, setCurrentTags] = useState(initialTags);
    const { showSnackbar } = useSnackbar();

    const { queryParams } = useFileManager();

    if (editing) {
        return (
            <>
                <Hotkeys
                    disabled={!editing}
                    zIndex={60}
                    keys={{
                        esc: () => {
                            setSaving(true);
                            client
                                .mutate({
                                    mutation: UPDATE_FILE_BY_SRC,
                                    variables: {
                                        src: file.src,
                                        data: { tags: currentTags }
                                    },
                                    refetchQueries: [{ query: LIST_TAGS }],
                                    update: (cache, updated) => {
                                        const newFileData = get(
                                            updated,
                                            "data.files.updateFileBySrc.data"
                                        );

                                        // 1. Update files list cache
                                        let data = cloneDeep(
                                            cache.readQuery({
                                                query: LIST_FILES,
                                                variables: queryParams
                                            })
                                        );

                                        data.blockFiles.listFiles.data.forEach(item => {
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
                                })
                                .then(() => {
                                    setSaving(false);
                                    setEdit(false);
                                    showSnackbar("Tags successfully updated.");
                                });
                        }
                    }}
                />
                <TagsComponent
                    disabled={saving}
                    value={currentTags}
                    onChange={tags => setCurrentTags(tags.map(tag => tag.toLowerCase()))}
                    autoFocus
                    placeholder={"Enter a tag and press enter"}
                />
            </>
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
