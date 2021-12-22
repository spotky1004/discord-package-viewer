import express from "express";
import path from "path";

const __dirname = path.resolve();

const app = express();

app.use(express.static(path.join(__dirname, "src")));

app.listen(8080, () => {
  console.log("Listning on port", 8080);
});
