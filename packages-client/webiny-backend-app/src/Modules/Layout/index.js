import {Webiny} from 'webiny-client';
import Footer from './Footer';

class Layout extends Webiny.App.Module {

    init() {
        this.name = 'Layout';
        this.registerDefaultComponents({Footer});
    }
}

export default Layout;