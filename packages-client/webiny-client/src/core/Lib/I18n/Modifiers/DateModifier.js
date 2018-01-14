import Webiny from './../../../Webiny';

class DateModifier {
    getName() {
        return 'date';
    }

    execute(value) {
        return Webiny.I18n.date(value)
    }
}

export default DateModifier;