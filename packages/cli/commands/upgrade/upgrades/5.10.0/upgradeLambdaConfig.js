const { Node, SyntaxKind } = require("ts-morph");

module.exports.upgradeLambdaConfig = (project, context) => {
    context.info("Updating Lambda runtime and layers...");

    const sourceFiles = project.getSourceFiles("api/pulumi/**/*.ts");
    for (const file of sourceFiles) {
        file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
            .filter(node => node.getText() === "aws.lambda.Function")
            .forEach(lambda => {
                lambda.getParent().forEachDescendant(node => {
                    // Update runtime
                    if (Node.isPropertyAssignment(node) && node.getName() === "runtime") {
                        const string = node.getInitializer();
                        if (string.getLiteralValue() === "nodejs10.x") {
                            string.setLiteralValue("nodejs12.x");
                        }
                    }

                    // Update layer
                    if (
                        Node.isStringLiteral(node) &&
                        node.getLiteralValue() === "webiny-v4-sharp"
                    ) {
                        node.setLiteralValue("sharp");
                    }
                });
            });
    }
};
