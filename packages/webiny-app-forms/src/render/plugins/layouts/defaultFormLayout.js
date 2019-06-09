// @flow
import React from "react";
import type { FormLayoutPluginType } from "webiny-app-forms/types";

export default ({
    type: "forms-form-layout",
    name: "forms-form-layout-default",
    label: "Default layout",
    render({ submit, layout: rows }) {
        return (
            <>
                {rows.map((fieldsInRow, rowIndex) => (
                    <div key={rowIndex}>
                        {fieldsInRow.map((field, fieldIndex) => (
                            <span
                                key={fieldIndex}
                                style={{
                                    display: "inline-block",
                                    width: `calc(100% / ${fieldsInRow.length})`
                                }}
                            >
                                {field}
                            </span>
                        ))}
                    </div>
                ))}
                <div style={{ padding: 10 }}>
                    <button onClick={submit}>Submit</button>
                </div>
            </>
        );
    }
}: FormLayoutPluginType);
