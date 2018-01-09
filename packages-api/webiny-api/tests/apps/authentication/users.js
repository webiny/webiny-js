import { app, Endpoint, ApiResponse, ApiErrorResponse, AuthError } from 'webiny-api/src';
import User from './entities/user';

class Users extends Endpoint {
    init(api) {
        api.get('/me', async function () {
            const user = await app.getAuth().getUser();
            if (!user) {
                return new ApiErrorResponse({}, 'Invalid user', 'WBY_NOT_AUTHENTICATED', 401);
            }
        });

        api.post('/', async function ({ req }) {
            const user = new User();
            user.populate(req.body);
            await user.save();
            const data = await user.toJSON('id,email');
            return new ApiResponse(data);
        });

        api.post('/login', async function ({ req }) {
            try {
                const token = await app.getAuth().processLogin(req.body.email, req.body.password);
                const user = await app.getAuth().getUser();
                const userData = await user.toJSON('id,email');
                const data = {
                    token,
                    user: userData
                };
                return new ApiResponse(data);
            } catch (e) {
                if (e instanceof AuthError) {
                    return new ApiErrorResponse({}, e.getMessage(), 'WBY_INVALID_CREDENTIALS');
                }

                return new ApiErrorResponse({}, e.message);
            }
        });

        api.get('/', async function () {
            const user = await app.getAuth().getUser();
            if (!user) {
                return new ApiErrorResponse({}, 'Invalid user', 'WBY_NOT_AUTHENTICATED');
            }

            const users = await Promise.all((await User.find()).map(u => u.toJSON('email')));
            return new ApiResponse(users);
        });
    }
}

Users.classId = 'Authentication.Users';
export default Users;