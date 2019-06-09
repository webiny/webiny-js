import React from "react";
import { getPlugins } from "webiny-plugins";

export default ({ id, form, fields }) => {
    const field = fields.find(field => field.id === id);
    const plugin = getPlugins("forms-field-render").find(
        plugin => plugin.field.type === field.type
    );

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
