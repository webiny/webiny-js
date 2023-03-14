import React, { useMemo } from "react";
import { cloneDeep } from "lodash";
import { Input } from "@webiny/ui/Input";
import { Form, FormOnSubmit } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useSnackbar } from "~/hooks/useSnackbar";
import { LIST_FILES, ListFilesQueryResponse } from "./../graphql";
import { useFileManager } from "./../FileManagerContext";
import { FileItem } from "../types";
import { useUpdateFile } from "./useUpdateFile";

interface NameProps {
    file: FileItem;
    canEdit: (file: FileItem) => boolean;
}

interface NameFormData {
    name: string;
}

const Name: React.FC<NameProps> = ({ file, canEdit }) => {
    const name = file.name || "";
    const { showSnackbar } = useSnackbar();
    const { updateFile } = useUpdateFile(file);

    const { queryParams } = useFileManager();

    const onSubmit: FormOnSubmit<NameFormData> = async ({ name }) => {
        // Bail out if name is same as the current file name.
        if (name === file.name) {
            return;
        }

        await updateFile({ name }, cache => {
            const data = cloneDeep(
                cache.readQuery<ListFilesQueryResponse>({
                    query: LIST_FILES,
                    variables: queryParams
                })
            );

            if (data) {
                data.fileManager.listFiles.data.forEach(item => {
                    if (item.src === file.src) {
                        item.name = name;
                    }
                });
            }

            cache.writeQuery({
                query: LIST_FILES,
                variables: queryParams,
                data: data
            });
        });

        showSnackbar("Name successfully updated.");
    };

    const editContent = useMemo(() => {
        return (
            <Form<NameFormData> data={{ name }} onSubmit={onSubmit}>
                {({ Bind, submit }) => (
                    <Bind name={"name"} validators={validation.create("required")}>
                        <Input
                            disabled={!canEdit(file)}
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
    }, [name, file.name, canEdit]);

    return <li-content>{editContent}</li-content>;
};

export default Name;
