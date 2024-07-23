import { ObjectId } from "mongodb";
import { QuerySchema } from "./contract";

function convertLike(value: string) {
  const regex: any = new RegExp(
    '.*' + escapeRegExp(value) + '.*',
    'i',
  );

  return { "$regex": regex }
}

function convertAndOr(filterValue) {
  for (let orAnd of filterValue) {
    convertFilter(orAnd)
  }
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function convertFilter(filter: QuerySchema['filter']) {
  Object.keys(filter).forEach(k => {
    let filterValue = filter[k]

    if (k[0] != '$') {
      if (typeof filterValue === 'object') {
        const queryKey = Object.keys(filterValue)[0];
        switch (queryKey) {
          case '$id':
            filterValue = new ObjectId(filterValue[queryKey]);
            break;
          case '$eq':
            if (typeof filterValue[queryKey] == 'string')
              filterValue = {
                "$regex": '^' + escapeRegExp(filterValue[queryKey]) + '$',
                "$options": "i"
              };
            break;
          case '$inId':
            filterValue = { '$in': filterValue[queryKey].map(v => new ObjectId(v)) }
            break;

          default:
            break;
        }
      }
      else if (filter[k] == false) {
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

  return filter;
}

function convertRelation(schema, parentName: string, relation: QuerySchema['relations']) {
  let relations = []
  relation.forEach(rel => {
    try {
      let currentRel: any[] = schema[parentName].relations[rel.name]
      if (rel.relations) {
        currentRel = currentRel.map(((rel2: any) => {
          rel2 = JSON.parse(JSON.stringify(rel2));
          if (Object.keys(rel2)[0] == '$lookup') {
            rel2['$lookup']['pipeline'] = [];
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

function convertPaginated(page: number, perpage: number = 20): [
  { $skip: number },
  { $limit: number }
] {
  return [
    { $skip: (page - 1) * perpage },
    { $limit: perpage },
  ]
}

export const queBuiMongoConvertFilter = convertFilter;

export function queBuiMongo(param: { schema: any, req: QuerySchema }) {
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

  if (req?.sort) {
    try {
      const sort: { [k: string]: number } = {}
      for (const key in req?.sort) {
        if (req?.sort[key] == 'asc') {
          sort[key] = 1
        }
        else {
          sort[key] = -1
        }
      }
      resp = [
        ...resp,
        { "$sort": sort }
      ]
    } catch (error) { }
  }

  // console.log(JSON.stringify(req.filter))

  if (req?.page) {
    resp = [...resp, ...convertPaginated(req?.page, req?.perpage)]
  }

  return resp;
}