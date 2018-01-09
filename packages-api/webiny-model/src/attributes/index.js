const char = require('./charAttribute');
const boolean = require('./booleanAttribute');
const integer = require('./integerAttribute');
const float = require('./floatAttribute');
const dynamic = require('./dynamicAttribute');
const model = require('./modelAttribute');
const models = require('./modelsAttribute');

const date = require('./dateAttribute');

module.exports = {
    char,
    boolean,
    integer,
    float,
    dynamic,
    model,
    models,
    date
};