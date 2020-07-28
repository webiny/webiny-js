const MAX_RETRIES = 30;
const WAIT_BETWEEN_RETRIES = 3000;

const sleep = () =>
    new Promise(resolve => {
        setTimeout(resolve, WAIT_BETWEEN_RETRIES);
    });

Cypress.Commands.add("reloadUntil", callback => {
    return cy.log(`Reloading until a condition is met...`).then(() => {
        let retries = -1;
        function check() {
            retries++;
            return cy.then(async response => {
                const result = await callback(response);
                try {
                    if (!result) {
                        throw Error();
                    }

                    return cy.log("Condition met, moving on...");
                } catch (err) {
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
