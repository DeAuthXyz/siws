

export interface Get<
    PathParams = { [key: string]: unknown },
    QueryParams = { [key: string]: unknown },
    Output = { [key: string]: unknown }
> {
    parameters: {
        path?: PathParams;
        query: QueryParams;
    };
    responses: {
        200: Output;
    };
}

export interface Post<
    PathParams = { [key: string]: unknown },
    RequestBody = { [key: string]: unknown },
    QueryParams = { [key: string]: unknown },
    Output = { [key: string]: unknown }
> {
    parameters: {
        path?: PathParams;
        body: RequestBody;
        query?: QueryParams;
    };
    responses: {
        200: Output;
    };
}

export interface Put<
    PathParams = { [key: string]: unknown },
    RequestBody = { [key: string]: unknown },
    QueryParams = { [key: string]: unknown },
    Output = { [key: string]: unknown }
> {
    parameters: {
        path?: PathParams;
        body: RequestBody;
        query?: QueryParams;
    };
    responses: {
        200: Output;
    };
}

export interface Delete<
    PathParams = { [key: string]: unknown },
    QueryParams = { [key: string]: unknown },
    Output = { [key: string]: unknown }
> {
    parameters: {
        path?: PathParams;
        query: QueryParams;
    };
    responses: {
        200: Output;
    };
}

export interface Patch<
    PathParams = { [key: string]: unknown },
    RequestBody = { [key: string]: unknown },
    QueryParams = { [key: string]: unknown },
    Output = { [key: string]: unknown }
> {
    parameters: {
        path?: PathParams;
        body: RequestBody;
        query?: QueryParams;
    };
    responses: {
        200: Output;
    };
}

export type RecursiveJSONSchema = {
    description?: string
    type: string
    const?: string
    format?: string
    properties?: {
        [key: string]: RecursiveJSONSchema
    }
    items?: RecursiveJSONSchema
    required?: string[]
}


export interface GET {
  '/api/authorize': {
    parameters: {        path?: never;
        query: {    nonce: string | undefined;}
;
}
;
    responses: {    200: { redirect_url: string; } | { error: string; }}
;
    errors?: never;
  };
}

export interface POST {
  '/api/foo': {
    parameters: {        body: { name: string; age: number; email: string; };
        path?: never;
        query: {    premium: string | null;}
;
}
;
    responses: {    200: { name: string; age: number; email: string; id: number; }}
;
    errors?: never;
  };
  '/api/signin': {
    parameters: {        path?: never;
}
;
    responses: {    200: { error: string; } | { redirect_url: string; } | { error: string; }}
;
    errors?: never;
  };
}

export type PUT = object;

export type DELETE = object;

export type PATCH = object;

export type APIPaths = GET & POST & PUT & DELETE & PATCH;

undefined