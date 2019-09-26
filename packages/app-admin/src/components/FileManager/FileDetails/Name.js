// @flow
/* eslint-disable */
import React, { useState } from "react";
import { get, cloneDeep } from "lodash";
import { useApolloClient } from "react-apollo";
import { css } from "emotion";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { UPDATE_FILE_BY_SRC, LIST_FILES } from "./../graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useFileManager } from "./../FileManagerContext";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Name({ file }: *) {
    const [editing, setEdit] = useState(false);
    const name = file.name || "";

    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const { queryParams } = useFileManager();

    if (editing) {
        return (
            <Form
                data={{
                    name
                }}
                onSubmit={async ({ name }) => {
                    setEdit(false);
                    await client.mutate({
                        mutation: UPDATE_FILE_BY_SRC,
                        variables: {
                            src: file.src,
                            data: { name }
                        },
                        update: (cache, updated) => {
                            const newFileData = get(updated, "data.files.updateFileBySrc.data");
                            const data = cloneDeep(
                                cache.readQuery({
                                    query: LIST_FILES,
                                    variables: queryParams
                                })
                            );

                            data.files.listFiles.data.forEach(item => {
                                if (item.src === newFileData.src) {
                                    item.name = newFileData.name;
                                }
                            });

                            cache.writeQuery({
                                query: LIST_FILES,
                                variables: queryParams,
                                data: data
                            });
                        }
                    });

                    showSnackbar("Name successfully updated.");
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        <Bind name={"name"}>
                            <Input autoFocus placeholder={"Enter name"} />
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
            <div className={style.editTag}>
                {name}
                <br />
                <a onClick={() => setEdit(true)}>
                    <EditIcon /> Edit
                </a>
            </div>
        </>
    );
}

export default Name;
