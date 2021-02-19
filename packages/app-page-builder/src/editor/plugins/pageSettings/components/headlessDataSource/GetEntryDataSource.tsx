import React, { useCallback, Fragment } from "react";
import { parse } from "graphql/language";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary } from "@webiny/ui/Button";
import { QueryEditor } from "graphiql/dist/components/QueryEditor";
import { ResultViewer } from "graphiql/dist/components/ResultViewer";
import { CircularProgress } from "@webiny/ui/Progress";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { validation } from "@webiny/validation";
import { useDataSource } from "./useDataSource";

const VoidComponent = () => {
    return null;
};

const variableTypes = {
    String: "text",
    Number: "number",
    Long: "number",
    Int: "number"
};

export const GetEntryDataSource = props => {
    const { Bind } = props;

    const getVariables = useCallback((dataSource, query) => {
        try {
            const parsedQuery = parse(query);
            const operation = parsedQuery.definitions.find(
                def => def.kind === "OperationDefinition"
            );

            if (operation) {
                const variables = [];
                // @ts-ignore
                for (const varDef of operation.variableDefinitions) {
                    const name = varDef.variable.name.value;
                    const required = varDef.type.kind === "NonNullType";
                    const type = varDef.type.type.name.value;
                    const existingVar = dataSource.config.variables.find(v => v.name === name);
                    const existingValue = existingVar ? existingVar.value : "";
                    const previewValue = existingVar ? existingVar.previewValue : "";
                    variables.push({ name, type, required, value: existingValue, previewValue });
                }
                return variables;
            }
        } catch {
            return null;
        }
    }, []);

    const { query, variables, state, prettifyQuery, runQuery, updateQuery } = useDataSource({
        ...props,
        getVariables
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const voidCallback = useCallback(() => {}, []);

    return (
        <Fragment>
            <Grid>
                <Cell span={12}>
                    <Tooltip content={"Shift+Ctrl+P"} placement={"bottom"}>
                        <ButtonSecondary onClick={prettifyQuery}>Prettify</ButtonSecondary>
                    </Tooltip>
                    &nbsp;
                    <Tooltip content={"Ctrl+Enter"} placement={"bottom"}>
                        <ButtonSecondary onClick={runQuery}>Run query</ButtonSecondary>
                    </Tooltip>
                </Cell>
                <Cell span={12}>
                    <div className="graphiql-container">
                        {state.loading ? <CircularProgress label={"Running query..."} /> : null}
                        <QueryEditor
                            value={query}
                            schema={state.schema}
                            onHintInformationRender={voidCallback}
                            onPrettifyQuery={prettifyQuery}
                            onRunQuery={runQuery}
                            onEdit={updateQuery}
                        />
                        <ResultViewer
                            value={state.response ? JSON.stringify(state.response, null, 2) : ""}
                            registerRef={voidCallback}
                            ImagePreview={VoidComponent as any}
                        />
                    </div>
                    {state.error ? (
                        <FormElementMessage error={true}>{state.error}</FormElementMessage>
                    ) : null}
                </Cell>
            </Grid>
            {variables.map((variable, index) => {
                return (
                    <Grid key={variable.name}>
                        <Cell span={6}>
                            <Bind
                                name={`config.variables.${index}.value`}
                                validators={validation.create("required")}
                            >
                                <Input
                                    outlined
                                    label={`\$${variable.name}`}
                                    description={
                                        <span>
                                            Enter a value to use for data rendering. Example:{" "}
                                            <strong>{"${path." + variable.name + "}"}</strong>
                                        </span>
                                    }
                                />
                            </Bind>
                        </Cell>
                        <Cell span={6}>
                            <Bind
                                name={`config.variables.${index}.previewValue`}
                                validators={variable.required ? validation.create("required") : []}
                            >
                                <Input
                                    outlined
                                    label={"Preview value"}
                                    description={"Enter a value to use for data preview."}
                                    type={variableTypes[variable.type]}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            })}
        </Fragment>
    );
};
