import { Controller, Route, Request, Response, Get, Post, Put, Delete, Security, Body} from 'tsoa'
import { User, IUser } from '../models/User';
import * as express from 'express';

interface ICreateUserDto extends IUser{
    password: string
};

export interface ErrorResponseModel {
    status: number;
    message: string;
  }

@Route('api/v1/user/')
export class UserController extends Controller{

    @Get()
    public async getAll(): Promise<IUser[]> {
        try {
            return await User.find();            
        } catch (error) {
            console.error(error);
        }
    }
    
    @Get('{id}')
    public async get(id: string, @Request() request: express.Request, response: express.Response): Promise<IUser> {
        try {
            let user = await User.findById(id);
            return user;
        } catch (error) {
            console.error(error);
            if (error.name === 'CastError') {
                const errorResponseModel: ErrorResponseModel = {
                    message: 'User not found!',
                    status: 404
                }
                request.res.status(404).send(errorResponseModel).end();
            }
        }
    }
    
    // @Response<Error>('default', 'Unexpected error')
    @Post()
    public async create(@Body() body: ICreateUserDto, @Request() request: express.Request): Promise<IUser> {        
        try {
            return await User.create(body);
        } catch (error) {
            console.error(error);
            if (error) {
                if (error.name === 'MongoError' && error.code === 11000) {
                    // const modal = {} as ErrorResponseModel;
                    const errorResponseModel: ErrorResponseModel = {
                        message: 'User already exist!',
                        status: 422
                    }
                    request.res.status(422).send(errorResponseModel).end();
                    // const response = (<any>request).res as express.Response;
                    // response.status(422);
                    // return let b :ErrorResponseModel();
                    // return errorResponseModel;
                    // return Promise.reject(new Error('Unexpected'));
                    // return Promise.reject(new Error('Unexpected'));
                    // let err = JSON.stringify(errorResponseModel)
                    // throw err;
                    // return Promise.reject(new Error('Unexpected'));
                    // return Promise.reject(errorResponseModel);
                    // throw error;
                }
          
                // Some other error
                // return response.status(422).send(err);
              }
        }
    }

    @Put('{id}')
    public async update(id: string, @Body() body: IUser): Promise<IUser> {
        try {
            return await User.findOneAndUpdate(id, body);            
        } catch (error) {
            console.error(error);
        }
    }
}