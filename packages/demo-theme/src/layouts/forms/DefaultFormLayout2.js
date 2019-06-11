// @flow
import React from "react";

const DefaultFormLayout = ({ submit, layout: rows }) => {
    return (
        <>
            <h1>DefaultFormLayout - 2</h1>
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
};

export default DefaultFormLayout;
