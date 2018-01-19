import {attributes} from 'webiny-model'
import fecha from 'fecha'

class DateAttribute extends attributes.date {
	setStorageValue(value) {
		if (value === null) {
			return super.setValue(value);
		}

		return super.setStorageValue(value instanceof Date ? value : fecha.parse(value, 'YYYY-MM-DD HH:mm:ss'));
	}

	async getStorageValue() {
		const value = await attributes.date.prototype.getStorageValue.call(this);
		if (value instanceof Date) {
			return fecha.format(value, 'YYYY-MM-DD HH:mm:ss');
		}
		return value;
	}
}

export default DateAttribute;