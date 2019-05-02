// @flow
/* eslint-disable */
import React, { useState } from "react";
import { ButtonSecondary, ButtonPrimary } from "webiny-ui/Button";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";
import { ReactComponent as EditIcon } from "./../icons/round-edit-24px.svg";
import { css } from "emotion";
import { updateFileBySrc, listFiles } from "./../graphql";
import { compose } from "recompose";
import { withSnackbar } from "webiny-admin/components";
import { graphql } from "react-apollo";
import { get, cloneDeep } from "lodash";

const style = {
    editTag: css({
        cursor: "pointer",
        display: "inline-block"
    })
};

function Name({ state: parentState, gqlUpdateFileBySrc, showSnackbar, file }) {
    const [editing, setEdit] = useState(false);
    const name = file.name || "";

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
                                    variables: parentState.queryParams
                                })
                            );

                            data.files.listFiles.data.forEach(item => {
                                if (item.src === newFileData.src) {
                                    item.name = newFileData.name;
                                }
                            });

                            cache.writeQuery({
                                query: listFiles,
                                variables: parentState.queryParams,
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
