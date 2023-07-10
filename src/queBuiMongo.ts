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
    for (const search in orAnd) {
      if (search != '$') {
        orAnd[search] = convertLike(orAnd[search])
      }
      else if (['$and', '$or'].indexOf(search) != -1) {
        convertAndOr(filterValue)
      }
    }
  }
}

function convertFilter(filter: mongoSchema['filter']) {
  Object.keys(filter).forEach(k => {
    let filterValue = filter[k]
    if (filter[k] == false) {
      filterValue = '{$in: [null, false]}'
    }
    else if (filter[k] == true) {
      filterValue = true
    }
    else if (k[0] != '$') {
      filterValue = convertLike(filterValue)
    }
    else if (['$and', '$or'].indexOf(k) != -1) {
      convertAndOr(filterValue)
    }
  });
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