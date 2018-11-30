# webiny-load-assets

A small library for easy loading additional scripts and links (eg. stylesheets).

Example:

```
load(
    "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.css",
    "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js"
).then(() => {
    window.cookieconsent.initialise({
        palette: {
            popup: {
                background: "#000"
            },
            button: {
                background: "#f1d600"
            }
        }
    });
});
        ```