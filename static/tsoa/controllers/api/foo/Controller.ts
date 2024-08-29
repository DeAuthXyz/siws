import { Body, Controller, Response,Route, SuccessResponse } from "tsoa";
import { Post } from "tsoa";
import { Query } from "tsoa";

        @Route("/api/foo")
        export class apifooController extends Controller{
        @Post()public async post(
        @Body() body: { name: string; age: number; email: string; }
,@Query() premium: [object Object]
        ) {
                return ({} as { name: string; age: number; email: string; id: number; });
            }}

