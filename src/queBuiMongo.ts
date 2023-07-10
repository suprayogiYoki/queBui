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

function convertAndOr(filterValue) {
  for (let orAnd of filterValue) {
    convertFilter(orAnd)
  }
}

function convertFilter(filter: mongoSchema['filter']) {
  Object.keys(filter).forEach(k => {
    let filterValue = filter[k]
    if (k[0] != '$') {
      if (filter[k] == false) {
        filterValue = { $in: [null, false] }
      }
      else if (filter[k] == true) {
        filterValue = true
      }
      else {
        filterValue = convertLike(filterValue)
      }
    }
    else if (['$and', '$or'].indexOf(k) != -1) {
      convertAndOr(filterValue)
    }
    filter[k] = filterValue;
  });
}

function convertRelation(schema, parentName: string, relation: mongoSchema['relations']) {
  let relations = []
  relation.forEach(rel => {
    try {
      let currentRel: any[] = schema[parentName].relations[rel.name]
      if (rel.relations) {
        currentRel = currentRel.map(((rel2:any)=>{
          rel2 = JSON.parse(JSON.stringify(rel2));
          if (Object.keys(rel2)[0] == '$lookup') {
            rel2['$lookup']['pipeline'] = [];
            console.log('1) add pipeline')
            rel2['$lookup']['pipeline'] = [ 
              ...rel2['$lookup']['pipeline'], 
              ...convertRelation(schema, rel2['$lookup']['from'], Object.create(rel.relations))
            ]
          }
          return rel2;
        }));
      }
      relations = [...relations, ...currentRel];
    } catch (error) {
    }
  });
  return relations
}

export function queBuiMongo(param: { schema: any, req: mongoSchema }) {
  let resp: any[] = [];
  const { schema, req } = param;

  if (req?.relations) {
    resp = [...resp, ...convertRelation(schema, req.name, req?.relations)]
  }

  if (req?.filter) {
    convertFilter(req.filter)
    

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