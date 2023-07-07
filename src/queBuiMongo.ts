interface mongoSchema {
  name: string,
  relations?: [mongoSchema],
  filter?: {},
}

function convertLike(value: string) {
  const regex: any = new RegExp(
    '.*' + value + '.*',
    'i',
  );

  return { "$regex": regex }
}

function convertAndOr(filterValue){
  for (let orAnd of filterValue) {
    for (const search in orAnd) {
      if(search != '$'){
        orAnd[search] = convertLike(orAnd[search])
      }
      else if(['$and', '$or'].indexOf(search) != -1) {
        convertAndOr(filterValue)
      }
    }
  }
}

export function queBuiMongo(param: { schema: any, req: mongoSchema }) {
  let resp: any[] = [];
  const { schema, req } = param;

  if (req?.relations) {
    req.relations.forEach(rel => {
      try {
        resp = [...resp, ...(schema[req.name].relations[rel.name])];
      } catch (error) {

      }
    });
  }

  if (req?.filter) {
    Object.keys(req.filter).forEach(k => {
      let filterValue = req.filter[k]
      if (k[0] != '$') {
        req.filter[k] = convertLike(filterValue)
      }
      else if(['$and', '$or'].indexOf(k) != -1) {
        convertAndOr(filterValue)
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