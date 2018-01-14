import Webiny from './../../../Webiny';

class NumberModifier {
    getName() {
        return 'number';
    }

    execute(value) {
        return Webiny.I18n.number(value)
    }
}

export default NumberModifier;