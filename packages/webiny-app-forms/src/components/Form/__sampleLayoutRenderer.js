import React from "react";

export default ({ submit, layout: rows }) => {
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
};