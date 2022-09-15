import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Tags } from "@webiny/ui/Tags";
import { validation } from "@webiny/validation";
import { useBind } from "@webiny/form";
import { GroupSelect } from "./GroupSelect";

export const GeneralSettings = () => {
    const nameInput = useBind({ name: "name" });
    const modelIdInput = useBind({ name: "modelId" });
    const descriptionInput = useBind({ name: "description" });
    const groupInput = useBind({ name: "group", validators: validation.create("required") });
    const tagsInput = useBind({ name: "tags" });

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Input label={"Content model name"} {...nameInput} />
                </Cell>
                <Cell span={12}>
                    <Input label={"Content model ID"} {...modelIdInput} disabled={true} />
                </Cell>
                <Cell span={12}>
                    <Input rows={5} label={"Content model description"} {...descriptionInput} />
                </Cell>
                <Cell span={12}>
                    <GroupSelect {...groupInput} />
                </Cell>
                <Cell span={12}>
                    <Tags label={"Tags"} {...tagsInput} />
                </Cell>
            </Grid>
        </React.Fragment>
    );
};
