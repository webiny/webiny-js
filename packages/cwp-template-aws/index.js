const inquirer = require("inquirer");
const setup = require("./setup");

function runInquirer({ projectName, root } = {}) {
    console.log(
        "In order to setup your new Webiny project, please answer the following question."
    );
    console.log();
    inquirer
        .prompt([
            {
                type: "list",
                message: "Do you want to have your API deployed into a Virtual Private Cloud (VPC)?",
                name: "vpc",
                choices: [
                    {
                        name: "Yes (more secure, includes a NAT Gateway, incurs cost)",
                        value: true
                    },
                    {
                        name: "No (less secure, all deployed resources are free tier eligible)",
                        value: false
                    }
                ]
            }
        ])
        .then(({ vpc }) => setup({ projectName, projectRoot: root, vpc }))
        .catch(e => {
            if (e.isTtyError) {
                console.log("Could not start setup wizard in current environment.");
            } else {
                console.log("Something went wrong:");
                console.log(e);
            }
        });
}

module.exports = runInquirer;

runInquirer();
