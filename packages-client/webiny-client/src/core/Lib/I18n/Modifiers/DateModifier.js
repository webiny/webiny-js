import { Webiny } from "./../../../../index";

class DateModifier {
    getName() {
        return "date";
    }

    execute(value) {
        return Webiny.I18n.date(value);
    }
}

export default DateModifier;
