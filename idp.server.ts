import Fastify from "fastify";
import jwt from "jsonwebtoken";
import { mdbid } from "@webiny/utils";

const fastify = Fastify();
const port = 3000;

const JWT_SECRET = "super_secret_key";
const predefinedRedirectUrl = "http://localhost:3001";

// Dummy user ID for token payload.
const DUMMY_USER_ID = "a1b2c3d4-e5f6-7890-1234-567890abcdef";

// {
//     "sub": "a336e4d182c945dfaf83170295bcfd7b",
//     "iat": 1769094214,
//     "email": "thomas.phipps@kibocommerce.com",
//     "kiboUserId": "a336e4d182c945dfaf83170295bcfd7b",
//     "tenantId": "root",
//     "roles": ["full-access", "full-access"],
//     "exp": 1769097814,
//     "iss": "kibo.com",
//     "aud": "webiny.com"
// }

// Generates a signed JWT.
function generateToken(
    type: "id" | "refresh",
    userId: string,
    claims: Record<string, any> = {}
): string {
    const now = Date.now() / 1000;

    if (type === "id") {
        return jwt.sign(
            {
                sub: userId,
                aud: "webiny.com",
                iat: now,
                jti: mdbid(),
                email: "user@example.com",
                kiboUserId: userId,
                tenantId: "root",
                iss: "kibo.com",
                roles: ["full-access"],
                ...claims
            },
            JWT_SECRET,
            { expiresIn: "5m" }
        );
    }

    return jwt.sign(
        {
            sub: userId,
            aud: "webiny.com",
            iat: now,
            jti: mdbid(),
            ...claims
        },
        JWT_SECRET,
        { expiresIn: "1d" }
    );
}

// Verifies and decodes a JWT.
function verifyToken(token: string): { sub: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

        return { sub: String(decoded.sub) };
    } catch {
        return null;
    }
}

// GET /login - generate JWT tokens and redirect.
fastify.get("/login", async (req, reply) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ----- /login -----\n`);

    const { tenantId } = req.query as { tenantId: string };
    const idToken = generateToken("id", DUMMY_USER_ID, { tenantId });
    console.log(`Created idToken:\n${idToken}\n`);

    const refreshToken = generateToken("refresh", DUMMY_USER_ID);
    console.log(`Created refreshToken:\n${refreshToken}\n`);

    const redirectUrl = new URL(predefinedRedirectUrl);
    redirectUrl.searchParams.set("idToken", idToken);
    redirectUrl.searchParams.set("refreshToken", refreshToken);
    redirectUrl.searchParams.set("tenantId", tenantId);

    await new Promise(resolve => {
        setTimeout(resolve, 1000);
    });

    reply.redirect(redirectUrl.toString(), 302);
});

// GET /refresh?refreshToken=...
fastify.get("/refresh", async (request, reply) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ----- /refresh -----\n`);

    const { token } = request.query as { token?: string };

    if (!token) {
        reply.status(400).send({ error: "Missing token." });
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        reply.status(401).send({ error: "Invalid or expired token." });
        return;
    }

    const newIdToken = generateToken("id", decoded.sub);
    const newRefreshToken = generateToken("refresh", decoded.sub);

    console.log(`Created a new idToken:\n${newIdToken}\n`);

    reply.send({ idToken: newIdToken, refreshToken: newRefreshToken });
});

fastify.addHook("onRequest", (request, reply, done) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests directly
    if (request.method === "OPTIONS") {
        reply.code(204).send();
    } else {
        done();
    }
});

// Start the server.
fastify.listen({ port }, err => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`🚀 Server running at http://localhost:${port}`);
});
