export interface QuerySchema {
  name: string,
  relations?: [QuerySchema],
  filter?: {
    [columnName:string]: string | { $oid: string} | any,
    $and?: string[],
    $or?: any[],
  },
  sort?: {
    [k: string]: string
  }
  page?: number,
  perpage?:number
}
