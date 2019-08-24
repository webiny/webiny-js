// @flow
/* eslint-disable */
import React, { useState } from "react";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { css } from "emotion";
import { updateFileBySrc, listFiles } from "./../graphql";
import { compose } from "recompose";
import { withSnackbar } from "@webiny/app-admin/components";
import { graphql } from "react-apollo";
import { get, cloneDeep } from "lodash";
import { useFileManager } from "./../FileManagerContext";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Name(props: *) {
    const { gqlUpdateFileBySrc, showSnackbar, file } = props;
    const [editing, setEdit] = useState(false);
    const name = file.name || "";

    const { queryParams } = useFileManager();

    if (editing) {
        return (
            <Form
                data={{
                    name
                }}
                onSubmit={async ({ name }) => {
                    setEdit(false);
                    await gqlUpdateFileBySrc({
                        variables: {
                            src: file.src,
                            data: { name }
                        },
                        update: (cache, updated) => {
                            const newFileData = get(updated, "data.files.updateFileBySrc.data");
                            const data = cloneDeep(
                                cache.readQuery({
                                    query: listFiles,
                                    variables: queryParams
                                })
                            );

                            data.files.listFiles.data.forEach(item => {
                                if (item.src === newFileData.src) {
                                    item.name = newFileData.name;
                                }
                            });

                            cache.writeQuery({
                                query: listFiles,
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

export default compose(
    graphql(updateFileBySrc, { name: "gqlUpdateFileBySrc" }),
    withSnackbar()
)(Name);
