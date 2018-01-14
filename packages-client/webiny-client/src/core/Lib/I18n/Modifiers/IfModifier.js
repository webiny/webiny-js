class IfModifier {
    getName() {
        return 'gender';
    }

    execute(value, parameters) {
        return value === parameters[0] ? parameters[1] : parameters[2] || '';
    }
}

export default IfModifier;