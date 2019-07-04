import React from "react";
import { DynamicFieldset } from "webiny-ui/DynamicFieldset";
import { Input } from "webiny-ui/Input";
import styled from "react-emotion";
import { Typography } from "webiny-ui/Typography";
import { ButtonSecondary, ButtonDefault } from "webiny-ui/Button";

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

type Props = {
    value: Array<Object>,
    onChange: Function,
    title: string,
    inputLabel: String,
    addButtonLabel: String
};

const WebhooksRequestsDynamicFieldset = (props: Props) => {
    const { onChange, value, Bind } = props;

    const addUrl = () => {
        const newValue = Array.isArray(value) ? [...value] : [];
        newValue.push("");
        onChange(newValue);
    };

    return (
        <DynamicFieldset value={value} onChange={onChange}>
            {({ actions, header, row, empty }) => (
                <>
                    {row(({ index }) => (
                        <Fieldset>
                            <Bind validators={["required", "url"]} name={`urls.${index}`}>
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
                            <ButtonDefault onClick={addUrl}>
                                {props.addButtonLabel}
                            </ButtonDefault>
                        </Header>
                    ))}
                    {header(() => (
                        <Header>
                            <Typography use={"overline"}>{props.title}</Typography>
                            <ButtonDefault
                                onClick={addUrl}
                            >
                                {props.addButtonLabel}
                            </ButtonDefault>
                        </Header>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};

export default WebhooksRequestsDynamicFieldset;
