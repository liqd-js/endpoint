export type RouteMetadata =
{
    method  : 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path    : string
    fn      : string
    args    : { index: number, type: string, name: string }[]
}