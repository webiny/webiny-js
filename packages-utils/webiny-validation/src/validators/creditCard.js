import ValidationError from './../validationError';

export default (value) => {
    if (!value) return;
    value = value + '';

    if (value.length < 12) {
        throw new ValidationError('Credit card number too short.');
    }

    if (/[^0-9-\s]+/.test(value)) throw new ValidationError('Credit card number invalid.');

    let nCheck = 0;
    let nDigit = 0;
    let bEven = false;

    value = value.replace(/ /g, '');
    value = value.replace(/\D/g, '');

    for (let n = value.length - 1; n >= 0; n--) {
        const cDigit = value.charAt(n);
        nDigit = parseInt(cDigit);

        if (bEven) {
            nDigit *= 2;
            if (nDigit > 9) {
                nDigit -= 9;
            }
        }

        nCheck += nDigit;
        bEven = !bEven;
    }

    if ((nCheck % 10) === 0) {
        return true;
    }

    throw new ValidationError('Credit card number invalid.');
};