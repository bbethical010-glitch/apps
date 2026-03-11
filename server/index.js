import { createServer } from "./src/app.js";
import { loadConfig } from "./src/config.js";

const config = loadConfig();
const app = createServer({ config });

app.listen(config.port, () => {
  console.log(`SSD Cloud Storage API listening on http://localhost:${config.port}`);
  console.log(`Storage root: ${config.storageRoot}`);
});
