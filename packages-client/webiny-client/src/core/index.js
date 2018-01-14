import Webiny from './base';

import Logger from './Lib/Logger';
import ClientStorage from './Lib/ClientStorage';
import Store from './Lib/ClientStorage/Store';
import LocalForage from './Lib/ClientStorage/LocalForage';
import appendLibrary from './Lib';

appendLibrary(Webiny);
Webiny.Logger = new Logger();
Webiny.LocalStorage = new ClientStorage(new Store());
Webiny.IndexedDB = new ClientStorage(new LocalForage());

export default Webiny;
