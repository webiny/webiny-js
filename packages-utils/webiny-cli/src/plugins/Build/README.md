# Build plugin
This plugin is responsible for building JS apps for development and production.
In the `webpack` folder you will find all the files that take part in the build process.

## Build configs
The build process consists of 2 configs: app config and a vendor config.

### App config
In development, `app.dev.js` file is used as a base config.
In production, `app.prod.js` is used.
The rules defined in these files apply only to the actual apps (`App.js` files of each JS app are the entry point for these configs).

### Vendor config
There are some 3rd-party dependencies Webiny can not work without, and most of them are bundled into a vendor DLL.
Config for the vendor DLL bundle is defined in `vendor.js` file. All apps depend on this bundle, and it is always built with `Webiny.Core` app.
To see the entire list of bundled dependencies, open `Apps/Webiny/Js/Core/webpack.vendor.js`.

This bundle is shared with all apps using the webpack [DllPlugin](https://webpack.js.org/plugins/dll-plugin/).

## Custom DLL bundles
You can create your own bundles inside your own apps by defining a `webpack.vendor.js` file and using the definition as seen in `Apps/Webiny/Js/Core/webpack.vendor.js`. 
The build process will detect that file and build it before the actual app. Once the app build starts, it will use your custom bundle alongside the Webiny DLL bundle.

There is absolutely nothing you need to do for your app to load the vendor bundles. During the build process, Webiny generates a `meta.json` file and it will be aware of your new vendor bundle which will always be loaded before your app bundle.

## Plugin hooks
You can hook into the build process using the following hooks (see `Apps/Webiny/Cli/README.md` for instructions on how to use hooks):

### `before-build`
This hook is processed before starting the build task (this is not related to webpack build. A `task` simply refers to the functionality this CLI plugin implements). 
At this point you can modify the plugin configuration like `environment` and `apps` that are selected for build.
Parameter passed to the hook handlers: `{config}`.

### `after-build`
This hook is processed after the webpack build is completed, right before finishing the build task. 
At this point you have access to the plugin `config` that was used to run the task and webpack `stats` object that was returned by webpack.
Parameter passed to the hook handlers: `{config, stats}`.

### `before-webpack`
This hook is processed before webpack begins building apps and at this point you can modify the config that will be passed to webpack.
Your callback will receive an object containing the webpack config that will be passed to webpack `{app}`.
You can modify the config as you see fit. The hook will be executed for each app that is going to be built.

Configs are modified by reference so you don't need to return anything.
This hook is useful when you want to globally intercept and modify app configs. 

## Route-based optimizations
Code splitting is great. But it is very easy to over-split. Fortunately it is not a problem for Webiny.
You can split stuff as much as you like in development and when you are ready for deployment to production server you can use route-based bundles to group your chunks into groups which will be loaded using a single request.
In the root of your JS app, define a `bundles.json` file and define which chunks you want to be bundled for each particular route:

```
{
    "*": [
        "Webiny/Ui/Components/Link",
        "Webiny/Ui/Components/Button",
        "Webiny/Ui/Components/Carousel",
        "Webiny/Ui/Components/Form"
    ],
    "/^\/features/": [
        "MyApp/Frontend/Components/Component1",
        "MyApp/Frontend/Components/Component2",
    ]
}
```

`"*"` - this bundle will be loaded on every URL in the system. 

`"/^\/features/"` - this bundle will only be loaded when you visit a page that matches this RegExp (the pattern will be used to construct a regex). 




