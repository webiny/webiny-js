// @flow
import { getNamespace } from 'cls-hooked';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthError, Entity } from './..';

type AuthConfig = {
    jwtSecret: string,
    entity: Entity
}

class Auth implements IAuth {
    config: AuthConfig;
    user: null | Entity;

    constructor(config: AuthConfig) {
        this.config = config;
        this.user = null;
    }

    getUser(): Promise<Entity | null> {
        if (this.user) {
            return Promise.resolve(this.user);
        }

        return new Promise(resolve => {
            const session = getNamespace('webiny-api');
            const req = session.get('req');
            const token = req.get('Webiny-Authorization');

            if (!token) {
                resolve(null);
            }

            jwt.verify(token, this.config.jwtSecret, (err, decoded) => {
                if (err) {
                    // TODO: check if token is expired
                    resolve(null);
                } else {
                    this.config.entity.findById(decoded.id).then(user => {
                        this.user = user;
                        resolve(user);
                    }).catch(e => {
                        // TODO: add error logger
                        resolve(null);
                    });
                }
            });
        });
    }

    async processLogin(email: string, password: string): Promise<string> {
        const user = await this.config.entity.findOne({ where: { email } });
        if (user) {
            return new Promise((resolve, reject) => {
                bcrypt.compare(password, user.password, (err, res) => {
                    if (err || !res) {
                        reject(new AuthError('Invalid credentials.', AuthError.INVALID_CREDENTIALS));
                    }
                    this.user = user;
                    const payload = {
                        id: user.id
                    };
                    const token = jwt.sign(payload, this.config.jwtSecret, { expiresIn: '30d' });
                    resolve(token);
                })
            });
        }

        throw new AuthError('Invalid credentials.', AuthError.INVALID_CREDENTIALS);
    }

    hashPassword(password: string): Promise<string> {
        return new Promise(resolve => {
            bcrypt.hash(password, bcrypt.genSaltSync(10), (err, hash) => {
                resolve(hash);
            });
        });
    }

    hashPasswordSync(password: string): string {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }
}

export default Auth;