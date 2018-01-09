import App from './App';
import {renderApp} from 'webiny-client';

renderApp({app: new App(), root: document.getElementById('root'), module});
