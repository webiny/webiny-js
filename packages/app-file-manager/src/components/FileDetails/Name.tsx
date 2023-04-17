import React, { useMemo } from "react";
import { Input } from "@webiny/ui/Input";
import { Form, FormOnSubmit } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useSnackbar } from "@webiny/app-admin";
import { useFile, useFileManagerApi, useFileManagerView } from "~/index";

interface NameFormData {
    name: string;
}

const Name = () => {
    const { file } = useFile();
    const name = file.name || "";
    const { showSnackbar } = useSnackbar();
    const { canEdit } = useFileManagerApi();
    const { updateFile } = useFileManagerView();

    const onSubmit: FormOnSubmit<NameFormData> = async ({ name }) => {
        // Bail out if name is same as the current file name.
        if (name === file.name) {
            return;
        }

        await updateFile(file.id, { name });

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
