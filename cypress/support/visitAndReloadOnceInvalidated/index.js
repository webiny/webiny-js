Cypress.Commands.add("visitAndReloadOnceInvalidated", url => {
    return cy
        .log(`Visiting ${url} and waiting for the CDN cache to be invalidated...`)
        .visit(url)
        .then(() => {
            let retries = -1;

            function doIt() {
                retries++;
                return cy
                    .log(`Invalidation check (attempt #${retries + 1})`)
                    .request(url)
                    .then(async response => {
                        try {
                            if (response.headers.age) {
                                throw Error("Still not invalidated...");
                            }
                            return cy
                                .log("Cache invalidated, moving on.")
                                .wait(1000)
                                .reload();
                        } catch (err) {
                            if (retries > 10) {
                                throw new Error(`retried too many times (${--retries})`);
                            }

                            return new Promise(resolve => {
                                setTimeout(() => {
                                    resolve();
                                }, 3333);
                            }).then(() => doIt());
                        }
                        return response;
                    });
            }

            return doIt();
        });
});
