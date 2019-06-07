// @flow
import React, { useCallback, useEffect } from "react";
import styled from "react-emotion";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { cloneDeep } from "lodash";
import { Cell, Grid } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Form as WebinyForm } from "webiny-form";

const Container = styled("div")({
    padding: "40px 60px"
});

const getIp = () =>
    new Promise((resolve, reject) => {
        const xhr = new window.XMLHttpRequest();
        xhr.open("GET", "https://api.ipify.org/?format=json", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();
        xhr.onload = function() {
            try {
                const response = JSON.parse(this.responseText);
                resolve(response.ip);
            } catch (e) {
                reject("");
            }
        };
    });

const plugins = [
    {
        name: "forms-field-render-firstName",
        type: "forms-field-render",
        field: {
            type: "firstName",
            render({ field }) {
                return <Input label={field.label} />;
            }
        }
    },
    {
        name: "forms-field-render-lastNme",
        type: "forms-field-render",
        field: {
            type: "lastName",
            render({ field }) {
                return <Input label={field.label} />;
            }
        }
    },
    {
        name: "forms-field-render-email",
        type: "forms-field-render",
        field: {
            type: "email",
            render({ field }) {
                return <Input label={field.label} />;
            }
        }
    },
    {
        name: "forms-field-render-website",
        type: "forms-field-render",
        field: {
            type: "website",
            render({ field }) {
                return <Input label={field.label} />;
            }
        }
    }
];

type Props = {
    preview?: boolean,
    data?: Object,
    id?: string
};

const renderFieldById = ({ id, form, fields }) => {
    const field = fields.find(field => field.id === id);
    const plugin = plugins.find(plugin => plugin.field.type === field.type);
    if (!plugin) {
        throw new Error(`Cannot find render plugin for field of type "${field.type}".`);
    }

    const { Bind } = form;
    return (
        <Bind name={field.fieldId} key={field.id}>
            {plugin.field.render({ field, form })}
        </Bind>
    );
};

const Form = ({ preview, data: { fields, layout } }: Props) => {
    if (!Array.isArray(layout)) {
        return null;
    }

    useEffect(() => {
        if (!preview) {
            // TODO: capture view
            console.log("nije preview");
        }
        console.log("preview");
    }, []);

    const onSubmitForm = useCallback(async () => {
        if (!preview) {
            const clientIp = getIp();
        }

        console.log("idee submit");
    });

    const layoutRenderer = ({ layout: rows }) => {
        return rows.map((fieldsInRow, rowIndex) => {
            return (
                <div key={rowIndex}>
                    {fieldsInRow.map((field, fieldIndex) => {
                        return (
                            <span
                                key={fieldIndex}
                                style={{
                                    display: "inline-block",
                                    width: `calc(100% / ${fieldsInRow.length})`
                                }}
                            >
                                {field}
                            </span>
                        );
                    })}
                </div>
            );
        });
    };

    return (
        <>
            <WebinyForm onSubmit={onSubmitForm}>
                {form => {
                    const render = cloneDeep(layout);
                    render.forEach(row => {
                        row.forEach((id, idIndex) => {
                            row[idIndex] = renderFieldById({ id, form, fields });
                        });
                    });

                    return layoutRenderer({ layout: render });
                }}
            </WebinyForm>
        </>
    );
};

export const PreviewTab = () => {
    const { state } = useFormEditor();
    return (
        <Container>
            <Form data={state.data} />
        </Container>
    );
};
