class GenderModifier {
    getName() {
        return 'gender';
    }

    execute(value, parameters) {
        return value === 'male' ? parameters[0] : parameters[1];
    }
}

export default GenderModifier;