// This will ensure the page is tested for 10 minutes, until the test can be considered as failed.
const MAX_RETRIES = 100;
const WAIT_BETWEEN_RETRIES = 3000;
const REPEAT_WAIT_BETWEEN_RETRIES = 2000;

const sleep = (ms = WAIT_BETWEEN_RETRIES) =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

Cypress.Commands.add("reloadUntil", (callback, options = {}) => {
    return cy.log(`Reloading until a condition is met...`).then(() => {
        let retries = -1;
        let repeat = 0;
        function check() {
            retries++;
            return cy.then(async response => {
                await sleep(REPEAT_WAIT_BETWEEN_RETRIES);
                const result = await callback(response);
                try {
                    if (!result) {
                        throw Error();
                    }

                    // Sometimes, reloading the page can still return previous, not-wanted result. To avoid this,
                    // users can pass `options.repeat`, which will reload the page and make the extra assertions
                    // `options.repeat` times.
                    if (options.repeat > 0) {
                        repeat++;
                        if (repeat <= options.repeat) {
                            if (repeat === 1) {
                                cy.log(
                                    `Success, but repeating the assertion ${options.repeat} times, to be extra sure.`
                                );
                            }
                            cy.log(`Assertion repeat ${repeat} / ${options.repeat}.`);
                            return cy
                                .log(`Reloading (attempt #${retries + 1})...`)
                                .reload()
                                .then(() => {
                                    return check();
                                });
                        }
                    }
                    return cy.log("Condition met, moving on...");
                } catch {
                    if (retries > MAX_RETRIES) {
                        throw new Error(`retried too many times (${--retries})`);
                    }

                    await sleep();
                    return cy
                        .log(`Reloading (attempt #${retries + 1})...`)
                        .reload()
                        .then(() => {
                            return check();
                        });
                }
                return response;
            });
        }

        return check();
    });
});
