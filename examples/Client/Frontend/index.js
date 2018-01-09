import App from './App';
import require from './require';
import {Webiny, renderApp} from 'webiny-client';

renderApp({
    app: new App(),
    root: document.getElementById('root'),
    module,
    beforeRender() {
        return new Promise((resolve, reject) => {
            $.getJSON('/tenants/12345.json', data => {
                console.log("Tenant", data);
                Webiny.Config.Api.Url = data.api;
                require(`/themes/${data.theme}/index`, function (err, module) {
                    resolve(module());
                });
            });
        });
    }
});