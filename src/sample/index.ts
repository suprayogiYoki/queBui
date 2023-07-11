import { queBuiMongo } from "../queBuiMongo";
import scheme from "./scheme";

console.log('test',
  JSON.stringify(
    queBuiMongo({
      schema: scheme,
      req: {
        "name": "users",
        "relations": [
          {
            "name": "client"
          }
        ],
        "filter": {
          "name": "o"
        },
        "sort": {
          "name": "desc"
        },
        "page": 2
      }
    })
  )
);