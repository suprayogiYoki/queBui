import { queBuiMongo } from "../queBuiMongo";
import scheme from "./scheme";

console.log(
  queBuiMongo({
    schema: scheme,
    req: {
      name: 'users',
      relations: [{name: 'client'}]
    }
  })
);