import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { ButtonSecondary, ButtonDefault } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";
import { BindComponent } from "@webiny/form";

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
`;

const StyledGrid = styled.div`
    width: 100%;
    display: grid;
    column-gap: 24px;
    grid-template-columns: 1fr 1fr auto;
`;

const removeButton = css`
    margin-top: 10px;
`;

interface WebhooksRequestsDynamicFieldsetProps {
    value?: Array<{ name: string; content: string }>;
    onChange?: (value: Array<{ name: string; content: string }>) => void;
    title: string;
    addButtonLabel: string;
    Bind: BindComponent;
}

const WebhooksRequestsDynamicFieldset = (props: WebhooksRequestsDynamicFieldsetProps) => {
    const { onChange, value, Bind } = props;

    const addParam = (): void => {
        const newValue = Array.isArray(value) ? [...value] : [];
        newValue.push({ name: "", content: "" });
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
                        <StyledGrid>
                            <div>
                                <Bind
                                    validators={validation.create("required")}
                                    name={`eventParams.${index}.name`}
                                >
                                    <Input label={"Name"} />
                                </Bind>
                            </div>
                            <div>
                                <Bind
                                    validators={validation.create("required")}
                                    name={`eventParams.${index}.content`}
                                >
                                    <Input label={"Content"} />
                                </Bind>
                            </div>
                            <ButtonSecondary
                                small
                                onClick={actions.remove(index)}
                                className={removeButton}
                            >
                                remove
                            </ButtonSecondary>
                        </StyledGrid>
                    ))}
                    {empty(() => (
                        <Header>
                            <Typography use={"overline"}>{props.title}</Typography>
                            <ButtonDefault onClick={addParam}>{props.addButtonLabel}</ButtonDefault>
                        </Header>
                    ))}
                    {header(() => (
                        <Header>
                            <Typography use={"overline"}>{props.title}</Typography>
                            <ButtonDefault onClick={addParam}>{props.addButtonLabel}</ButtonDefault>
                        </Header>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};

export default WebhooksRequestsDynamicFieldset;
