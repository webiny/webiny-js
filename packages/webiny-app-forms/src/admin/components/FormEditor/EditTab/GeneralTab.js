import React, { useEffect, useRef } from "react";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";

const GeneralTab = ({ Bind, slugify, uniqueId, fieldType }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current && inputRef.current.focus();
    }, []);

    if (typeof fieldType.renderSettings === "function") {
        fieldType.renderSettings({ Bind, slugify, uniqueId });
    }

    return (
        <Grid>
            <Cell span={6}>
                <Bind name={"label"} validators={["required"]} afterChange={slugify("id")}>
                    <Input label={"Label"} inputRef={inputRef} />
                </Bind>
            </Cell>
            <Cell span={6}>
                <Bind name={"id"} validators={["required", uniqueId]}>
                    <Input label={"Field ID"} />
                </Bind>
            </Cell>
            <Cell span={12}>
                <Bind name={"helpText"}>
                    <Input label={"Help text"} description={"Help text (optional)"} />
                </Bind>
            </Cell>
            <Cell span={12}>
                <Bind name={"placeholderText"}>
                    <Input label={"Placeholder text"} description={"Placeholder text (optional)"} />
                </Bind>
            </Cell>
            <Cell span={12}>
                <Bind name={"defaultValue"}>
                    <Input label={"Default value"} description={"Default value (optional)"} />
                </Bind>
            </Cell>
        </Grid>
    );
};

export default GeneralTab;
