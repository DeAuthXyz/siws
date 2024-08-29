import { Body, Controller, Response,Route, SuccessResponse } from "tsoa";
import { Post } from "tsoa";

        @Route("/api/signin")
        export class apisigninController extends Controller{
        @Post()public async post(
        
        ) {
                return ({} as { error: string; });
            }}

