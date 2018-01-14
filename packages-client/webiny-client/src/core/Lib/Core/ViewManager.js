import _ from 'lodash';
import Dispatcher from './Dispatcher';

class ViewManager {

    constructor() {
        this.placeholders = {};
    }

    getContent(placeholder) {
        return _.get(this.placeholders, placeholder);
    }

    render(content) {
        this.placeholders = content;

        return Dispatcher.dispatch('RenderView');
    }
}

export default new ViewManager;