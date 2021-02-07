import React, { useMemo } from "react";
import { get, cloneDeep } from "lodash";
import { useApolloClient } from "@apollo/react-hooks";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { UPDATE_FILE, LIST_FILES } from "./../graphql";
import { useFileManager } from "./../FileManagerContext";

function Name({ file }) {
    const name = file.name || "";
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const { queryParams } = useFileManager();

    const editContent = useMemo(() => {
        return (
            <Form
                data={{
                    name
                }}
                onSubmit={async ({ name }) => {
                    // Bail out if name is same as the current file name.
                    if (name === file.name) {
                        return;
                    }
                    // Update file.
                    await client.mutate({
                        mutation: UPDATE_FILE,
                        variables: {
                            id: file.id,
                            data: { name }
                        },
                        update: (cache, updated) => {
                            const newFileData = get(updated, "data.fileManager.updateFile.data");
                            const data: any = cloneDeep(
                                cache.readQuery({
                                    query: LIST_FILES,
                                    variables: queryParams
                                })
                            );

                            data.fileManager.listFiles.data.forEach(item => {
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
                    <Bind name={"name"} validators={validation.create("required")}>
                        <Input
                            autoFocus
                            placeholder={"Enter name"}
                            fullwidth={true}
                            onBlur={submit}
                            description={"A descriptive name is easier to remember."}
                        />
                    </Bind>
                )}
            </Form>
        );
    }, [name, file.name]);

    return <li-content>{editContent}</li-content>;
}

export default Name;
