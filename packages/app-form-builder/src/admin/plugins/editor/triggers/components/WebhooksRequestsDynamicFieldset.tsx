import React from "react";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Input } from "@webiny/ui/Input";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { ButtonSecondary, ButtonDefault } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";
import { BindComponent } from "@webiny/form";

const Fieldset = styled("div")({
    position: "relative",
    width: "100%",
    marginBottom: 15,
    ".webiny-ui-button": {
        position: "absolute",
        display: "block",
        right: 10,
        top: 13
    }
});

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15
});

interface WebhooksRequestsDynamicFieldsetProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    title: string;
    inputLabel: string;
    addButtonLabel: string;
    Bind: BindComponent;
}

const WebhooksRequestsDynamicFieldset = (props: WebhooksRequestsDynamicFieldsetProps) => {
    const { onChange, value, Bind } = props;

    const addUrl = (): void => {
        const newValue = Array.isArray(value) ? [...value] : [];
        newValue.push("");
        if (!onChange) {
            return;
        }
        onChange(newValue);
    };

    return (
        <DynamicFieldset value={value} onChange={onChange}>
            {({ actions, header, row, empty }) => (
                <>
                    {row(({ index }) => (
                        <Fieldset>
                            <Bind
                                validators={validation.create("required,url")}
                                name={`urls.${index}`}
                            >
                                <Input label={props.inputLabel} />
                            </Bind>
                            <ButtonSecondary small onClick={actions.remove(index)}>
                                remove
                            </ButtonSecondary>
                        </Fieldset>
                    ))}
                    {empty(() => (
                        <Header>
                            <Typography use={"overline"}>{props.title}</Typography>
                            <ButtonDefault onClick={addUrl}>{props.addButtonLabel}</ButtonDefault>
                        </Header>
                    ))}
                    {header(() => (
                        <Header>
                            <Typography use={"overline"}>{props.title}</Typography>
                            <ButtonDefault onClick={addUrl}>{props.addButtonLabel}</ButtonDefault>
                        </Header>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};

export default WebhooksRequestsDynamicFieldset;
