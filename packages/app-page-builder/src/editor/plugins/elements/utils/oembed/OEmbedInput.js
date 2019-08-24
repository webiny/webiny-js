import * as React from "react";
import { compose } from "recompose";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import withOEmbedData from "@webiny/app-page-builder/editor/components/withOEmbedData";

const OEmbedInput = ({ Bind, urlPlaceholder, urlDescription, getOEmbedData }) => {
    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"oembed"}>
                    {({ onChange }) => (
                        <Bind
                            name={"url"}
                            defaultValue={""}
                            validators={["required"]}
                            beforeChange={async (value, cb) => {
                                cb(value);
                                onChange(await getOEmbedData(value));
                            }}
                        >
                            <Input placeholder={urlPlaceholder} description={urlDescription} />
                        </Bind>
                    )}
                </Bind>
            </Cell>
        </Grid>
    );
};

export default compose(withOEmbedData())(OEmbedInput);
