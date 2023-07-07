import { queBuiMongo } from "../queBuiMongo";
import scheme from "./scheme";

console.log('test',
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
        "$or": [
          {
            "client.name": "o"
          }
        ]
      }
    }
  })[2]['$match']['$and'][0]
);