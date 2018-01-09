# CLI plugins

This folder contains CLI plugins that will be picked up by the `webiny-cli`.
If you develop your own plugins, you need to pass them to the `webiny-cli` using `webiny-cli.js` config file in the root of your project.

```
module.exports = {
    plugins: [
        new MyPlugin()
    ]
};
```


## Plugin hooks
Plugins can define hooks to allow hooking into the process and modify data from outside of the plugin itself.
In our built-in plugins we are already exposing a couple of hooks to allow developers to modify webpack configurations, for example. 
To add a hook handler, add it to `webiny-cli.js` config file in the root of your project"
 
 ```
 module.exports = {
     hooks: {
         'before-webpack': [
             ({configs}) => {
                  return new Promise((resolve, reject) => {
                     // Do something with `configs`
                     resolve();
                  });
              }
         ]
     }
 };
 ```

Hook handlers are simple functions that take an object containing data from the plugin as the only parameter and return a Promise.
When the promise is resolved - a hook handler is considered as done.