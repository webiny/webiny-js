import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { ButtonSecondary, ButtonDefault } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";
import { BindComponent } from "@webiny/form";

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
`;

const gridStyles = css`
    padding: 0 !important;
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

const WebhooksRequestsDynamicFieldset: React.FC<WebhooksRequestsDynamicFieldsetProps> = props => {
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
                        <div>
                            <Grid className={gridStyles}>
                                <Cell span={5}>
                                    <Bind
                                        validators={validation.create("required")}
                                        name={`eventParams.${index}.name`}
                                    >
                                        <Input label={"Name"} />
                                    </Bind>
                                </Cell>
                                <Cell span={5}>
                                    <Bind
                                        validators={validation.create("required")}
                                        name={`eventParams.${index}.content`}
                                    >
                                        <Input label={"Content"} />
                                    </Bind>
                                </Cell>
                                <Cell span={2}>
                                    <ButtonSecondary
                                        small
                                        onClick={actions.remove(index)}
                                        className={removeButton}
                                    >
                                        remove
                                    </ButtonSecondary>
                                </Cell>
                            </Grid>
                        </div>
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
