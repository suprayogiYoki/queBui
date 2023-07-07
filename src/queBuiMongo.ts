export function queBuiMongo(param: {
  schema: any, req: {
      name: string,
      relations?: [{
          name: string,
          alias?: string
          relation?: []
      }]
  }
}) {
  let resp:any[] = [];
  const { schema, req } = param;

  if (req?.relations) {
      req.relations.forEach(rel => {
        try {
          resp = [...resp, ...(schema[req.name].relations[rel.name])];
        } catch (error) {
          
        }
      });
  }

  return resp;
}