import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";

const GeneralSettings = ({ Bind }) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"}>
                        <Input label={"Content model title"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"modelId"}>
                        <Input disabled={true} label={"Content model ID"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"description"}>
                        <Input rows={5} label={"Content model description"} />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
