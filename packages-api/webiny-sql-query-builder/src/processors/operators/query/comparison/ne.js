import _ from 'lodash';

module.exports = {
    canProcess: ({value}) => {
        return _.has(value, '$ne');
    },
    process: ({key, value, processor}) => {
        if (value['$ne'] === null) {
            return key + ' IS NOT NULL';
        }

        return key + ' <> ' + processor.escape(value['$ne']);
    }
};