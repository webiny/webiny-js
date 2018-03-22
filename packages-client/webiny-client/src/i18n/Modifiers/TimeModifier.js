import Webiny from "webiny";

class TimeModifier {
    getName() {
        return "time";
    }

    execute(value) {
        return Webiny.I18n.time(value);
    }
}

export default TimeModifier;
