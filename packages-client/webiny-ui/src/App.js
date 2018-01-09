import {Webiny} from 'webiny-client';
import './Assets/styles.scss';
import registerComponents from './Components';
import registerVendors from './Vendors';

class Ui extends Webiny.App {
    constructor() {
        super();
        this.name = 'Webiny.Ui';
        registerComponents();
        registerVendors();
    }
}

export default Ui;