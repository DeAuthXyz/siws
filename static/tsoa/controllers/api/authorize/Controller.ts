import { Body, Controller, Response,Route, SuccessResponse } from "tsoa";
import { Get } from "tsoa";
import { Query } from "tsoa";

        @Route("/api/authorize")
        export class apiauthorizeController extends Controller{
        @Get()public async get(
        @Query() nonce: [object Object]
        ) {
                return ({} as { redirect_url: string; });
            }}

