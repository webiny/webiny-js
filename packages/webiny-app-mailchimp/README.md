# webiny-app-mailchimp
[![](https://img.shields.io/npm/dw/webiny-app-mailchimp.svg)](https://www.npmjs.com/package/webiny-app-mailchimp) 
[![](https://img.shields.io/npm/v/webiny-app-mailchimp.svg)](https://www.npmjs.com/package/webiny-app-mailchimp)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Enables inserting Mailchimp newsletter signup forms on your site.
  
## Install
```
npm install --save webiny-app-mailchimp
```

Or if you prefer yarn: 
```
yarn add webiny-app-mailchimp
```

Note: the [webiny-api-mailchimp](../webiny-api-mailchimp) is also required.

## Setup
To setup, you must register a set of plugins. For more information on 
plugins, please visit [Webiny documentation](https://docs.webiny.com/docs/developer-tutorials/plugins-crash-course).

#### Admin
```
import mailchimpPlugins from "webiny-app-mailchimp/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(...mailchimpPlugins);
```

Enables management of Mailchimp settings, which can be accessed via 
Settings section in the main menu. You will paste your Mailchimp API 
key here (this is required in order for the app to work properly). 
Additionally, this will also register Mailchimp element in CMS editor, 
which will enable you to insert newsletter signup forms in your pages. 
The element will be registered under the "Form" element category.

You can optionally register one or more newsletter signup 
form plugins (type: `pb-page-element-mailchimp-component`).

```js
{
        type: "pb-page-element-mailchimp-component",
        name: "pb-page-element-mailchimp-component-test1",
        title: "Test newsletter form",
        component: MailchimpTestForm
}
```

An example component can be found [here](src/render/components/MailchimpDefaultForm.js).

#### Site
```
import mailchimpPlugins from "webiny-app-mailchimp/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(mailchimpPlugins);
```

This enables rendering of Mailchimp newsletter signup form in your public website.

