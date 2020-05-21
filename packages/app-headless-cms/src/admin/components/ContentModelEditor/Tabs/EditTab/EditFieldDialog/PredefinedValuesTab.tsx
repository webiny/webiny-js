const PredefinedValuesTab = props => {
    const { fieldPlugin, form } = props;

    return fieldPlugin.field.renderPredefinedValues({ form });
};

export default PredefinedValuesTab;
