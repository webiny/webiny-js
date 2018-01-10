import App from './App';
import {Webiny, renderApp} from 'webiny-client';

renderApp({
    app: new App(),
    root: document.getElementById('root'),
    module
});