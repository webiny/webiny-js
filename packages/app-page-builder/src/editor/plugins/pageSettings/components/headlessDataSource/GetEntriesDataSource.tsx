import React, { useCallback, Fragment } from "react";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary } from "@webiny/ui/Button";
import { QueryEditor } from "graphiql/dist/components/QueryEditor";
import { ResultViewer } from "graphiql/dist/components/ResultViewer";
import { CircularProgress } from "@webiny/ui/Progress";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { useDataSource } from "./useDataSource";

const VoidComponent = () => {
    return null;
};

export const GetEntriesDataSource = props => {
    const { query, state, prettifyQuery, runQuery, updateQuery } = useDataSource(props);

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
        </Fragment>
    );
};
