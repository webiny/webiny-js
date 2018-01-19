import _ from 'lodash';

module.exports = {
	canProcess: ({key, value}) => {
		if (key.charAt(0) === '$') {
			return false;
		}

		return _.isArray(value) || _.has(value, '$in');
	},
	process: ({key, value, processor}) => {
		value = _.get(value, '$in', value);
		return key + ' IN(' + value.map(item => processor.escape(item)).join(', ') + ')';
	}
};