import React from "react";
import { Grid, CodeEditor, Text } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SchemaEditor = () => {
    return (
        <>
            <Grid.Column span={12}>
                <Text size={"sm"}>
                    Enter your&nbsp;
                    <a
                        href={"https://schema.org"}
                        target={"_blank"}
                        rel={"noreferrer noopener"}
                    >
                        schema.org
                    </a>
                    &nbsp; markup for this page:
                </Text>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.seo.structuredSchema"} defaultValue={""}>
                    {({ value, onChange }) => (
                        <CodeEditor
                            value={value}
                            height={400}
                            onChange={onChange}
                            language={"html"}
                        />
                    )}
                </Bind>
            </Grid.Column>
        </>
    );
};
