export function queBuiMongo(param: {
  schema: any, req: {
      name: string,
      relations?: [{
          name: string,
          alias?: string
          relation?: [],
      }],
      filter?: {},
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

  if(req?.filter) {

    Object.keys(req.filter).forEach(k=>{
      if(k[0] != '$') {
        const regex: any = new RegExp(
          '.*' + req.filter[k] + '.*',
          'i',
        );
        req.filter[k] = {
          "$regex": regex
        }
      }
    });

    resp = [
      ...resp, 
      {
        $match: {
          $and: [ 
            req.filter
          ],
        }
      },
    ]
  }

  return resp;
}