# webiny-app-mailchimp

Render Mailchimp newsletter signup form.

## Installation
`yarn add webiny-app-mailchimp`

## Setup
To setup, you must register a set of plugins. For more information on plugins, please visit Webiny documentation.

#### Admin

##### 1. Register plugins
```
import mailchimpPlugins from "webiny-app-mailchimp/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(...mailchimpPlugins);
```

Enables management of Mailchimp settings, which can be accessed via Settings section in the main menu. You will paste
your Mailchimp API key here (this is required in order for the app to work properly). 

Additionally, this will also register Mailchimp element in CMS editor, which will enable you to insert
newsletter signup forms in your pages. The element will be registered under the "Form" element category.

 
#### Site
```
import mailchimpPlugins from "webiny-app-mailchimp/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(mailchimpPlugins);
```

This enables rendering of Mailchimp newsletter signup form in your public website.

