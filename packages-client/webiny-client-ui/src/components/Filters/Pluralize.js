import React from 'react';
import {Webiny} from 'webiny-client';

class Pluralize extends Webiny.Ui.Component {

}

Pluralize.defaultProps = {
    plural: null,
    count: null,
    noun: null,
    pattern: '{count} {noun}',
    renderer() {
        let noun = this.props.noun;
        // If 'plural' is set, it will be used as plural form of given noun.
        if (this.props.plural && this.props.count !== 1) {
            noun = this.props.plural;
        }

        if (!this.props.plural && this.props.count !== 1) {
            noun = this.props.pluralize(this.props.noun, this.props.count);
        }

        const result = this.props.pattern.replace('{count}', this.props.count).replace('{noun}', noun);

        return <span>{result}</span>
    }
};


export default Webiny.createComponent(Pluralize, {
    modules: [{pluralize: () => import('pluralize')}]
});
