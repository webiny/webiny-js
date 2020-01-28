const fieldMap = {
    id: "_id"
};

function mapFieldId(fieldId) {
    if (fieldId in fieldMap) {
        return fieldMap[fieldId];
    }
    return fieldId;
}

export default function createMongoQuery(model, where, context) {
    const match = {};
    const filterOperators = context.plugins.byType("cms-filter-operator");

    function createCondition(key) {
        const value = where[key];
        const delim = key.indexOf("_");
        const fieldId = mapFieldId(key.substring(0, delim > 0 ? delim : undefined));
        let operator = delim > 0 ? key.substring(delim + 1) : "eq";

        const operatorPlugin = filterOperators.find(pl => pl.operator === operator);

        if (!operatorPlugin) {
            return;
        }

        const field = model.fields.find(f => f.fieldId === fieldId);
        return { [fieldId]: operatorPlugin.createCondition({ fieldId, field, value, context }) };
    }

    const whereKeys = Object.keys(where);

    if (whereKeys.length) {
        match.$and = [];
    }

    whereKeys.forEach(key => {
        match.$and.push(createCondition(key));
    });

    return match;
}
