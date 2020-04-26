import app, {MONGO_URI, DB_SCHEMA_TEST_NAME, TEST_ENV} from "../src/app";
import * as mongoose from 'mongoose'
import {IUserCreateDto, IUser, UserRepository} from "../src/repositories/UserRepository";
import * as request from "supertest";
import {Response} from "superagent";
import {IAuthenticationResponse, ILogin, IPaginateResult} from "../src/interfaces/miscInterfaces";

const user: IUserCreateDto = {
    username: 'user',
    password: 'user123',
    email: 'test@email.com',
    name: 'User'
};

const user2: IUserCreateDto = {
    username: 'user2',
    password: 'user123',
    email: 'test2@email.com',
    name: 'User'
};

const admin = {
    name: 'Admin',
    username: 'admin',
    email: 'admin@email.com',
    roles: ['admin'],
    password: 'admin123'
};

process.env.NODE_ENV = TEST_ENV;

beforeAll(async () => {
    let uri = `${MONGO_URI}/${DB_SCHEMA_TEST_NAME}`;
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    });
});

beforeEach(async () => {
    await deleteAllUsers();
});

afterEach(async () => {
    await deleteAllUsers();
});

describe("Server Online", () => {
    it("Ping Server", async () => {
        const response = await request(app).get("/ping");
        expect(response.text).toEqual("pong");
        expect(response.status).toEqual(200);
    });
});

describe("Authentication", () => {
    it("Create Account", async () => {
        let response = await signup();
        expect(response.status).toEqual(200);
        let body = response.body as IAuthenticationResponse;
        expect(body.user).not.toBeNull();
        expect(body.token).not.toBeNull();
    });

    it("Login", async () => {
        let response = await signup();
        expect(response.status).toEqual(200);
        response = await login();
        let body = response.body as IAuthenticationResponse;
        expect(response.status).toEqual(200);
        expect(body.user).not.toBeNull();
        expect(body.token).not.toBeNull();
    });
});

describe("User", () => {
    it("GET / ME", async () => {
        let token = await getToken();
        const response = await request(app)
            .get("/api/v1/user/me")
            .set('Authorization', 'Bearer ' + token);
        let body = response.body as IUser;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
        expect(body.username).toEqual(user.username);
    });
    it("POST / User", async () => {
        let token = await getAdminToken();
        const response = await request(app)
            .post("/api/v1/user")
            .set('Authorization', 'Bearer ' + token)
            .send(user);
        let body = response.body as IPaginateResult<IUser>;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
    });
    it("GET / User", async () => {
        const userCreated = await createUser(user);
        let token = await getAdminToken();
        const response = await request(app)
            .get(`/api/v1/user/${userCreated._id}`)
            .set('Authorization', 'Bearer ' + token);
        let body = response.body as IUser;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
        expect(body.username).toEqual(user.username);
    });
    it("GET / All Users", async () => {
        await createUser(user);
        await createUser(user2);
        let token = await getAdminToken();
        const response = await request(app)
            .get(`/api/v1/user`)
            .set('Authorization', 'Bearer ' + token);
        let body = response.body as IPaginateResult<IUser>;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
        expect(body.docs.length).toBeGreaterThan(0);
    });
    it("GET / Filter Users", async () => {
        await createUser(user);
        await createUser(user2);
        let token = await getAdminToken();
        const response = await request(app)
            .post(`/api/v1/user/filter`)
            .set('Authorization', 'Bearer ' + token);
        let body = response.body as IPaginateResult<IUser>;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
        expect(body.docs.length).toBeGreaterThan(0);
    });
    it("DELETE / User", async () => {
        const createdUser = await createUser(user);
        let token = await getAdminToken();
        const response = await request(app)
            .delete(`/api/v1/user/${createdUser._id}`)
            .set('Authorization', 'Bearer ' + token);
        let body = response.body;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
    });
    it.skip("UPDATE / User", async () => {
        const userCreated = await createUser(user);
        let nameUpdated = 'User Updated';
        userCreated.name = nameUpdated;
        let token = await getAdminToken();
        const response = await request(app)
            .put(`/api/v1/user/${userCreated._id}`)
            .set('Authorization', 'Bearer ' + token)
            .send(userCreated);
        let body = response.body as IUser;
        expect(response.status).toEqual(200);
        expect(body).not.toBeNull();
        expect(body.name).toEqual(nameUpdated);
    });
});

async function getToken(): Promise<string> {
    let response = await signup();
    expect(response.status).toEqual(200);
    response = await login();
    let body = response.body as IAuthenticationResponse;

    return body.token;
}

async function getAdminToken(): Promise<string> {
    await createAdminUser();
    let response = await login(admin.username, admin.password);
    expect(response.status).toEqual(200);
    let body = response.body as IAuthenticationResponse;

    return body.token;
}

async function signup(): Promise<Response> {
    return request(app)
        .post("/api/v1/authentication/signup")
        .send(user);
}

async function login(username: string = user.username, password: string = user.password): Promise<Response> {
    let iLogin: ILogin = {
        username: username,
        password: password
    };
    return request(app)
        .post("/api/v1/authentication/login")
        .send(iLogin);
}

async function deleteAllUsers() {
    try {
        await UserRepository.deleteMany({});
    } catch (error) {
        console.error(error);
    }
}

async function createUser(userDto: IUserCreateDto): Promise<IUser> {
    try {
        const user = await UserRepository.findOne({username: userDto.username});
        expect(user).toBeNull();
        return await UserRepository.create(userDto);
    } catch (error) {
        console.error(error);
    }
}

async function createAdminUser(): Promise<IUser> {
    try {
        const adminFound = await UserRepository.findOne({username: 'admin'});
        if (adminFound) return adminFound;
        return await UserRepository.create(admin);
    } catch (error) {
        console.error(error);
    }
}
