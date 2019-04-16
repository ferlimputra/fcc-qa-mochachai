import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { report as _report, on, run } from "./test-runner";

const app = express();
app.use(json());

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});

app.use(express.static(`${__dirname}/public`));

app.get("/hello", (req, res) => {
  const name = req.query.name || "Guest";
  res.type("txt").send(`hello ${name}`);
});

const travellers = function(req, res) {
  let data = {};
  if (req.body && req.body.surname) {
    switch (req.body.surname.toLowerCase()) {
      case "polo":
        data = {
          name: "Marco",
          surname: "Polo",
          dates: "1254 - 1324",
        };
        break;
      case "colombo":
        data = {
          name: "Cristoforo",
          surname: "Colombo",
          dates: "1451 - 1506",
        };
        break;
      case "vespucci":
        data = {
          name: "Amerigo",
          surname: "Vespucci",
          dates: "1454 - 1512",
        };
        break;
      case "da verrazzano":
      case "verrazzano":
        data = {
          name: "Giovanni",
          surname: "da Verrazzano",
          dates: "1485 - 1528",
        };
        break;
      default:
        data = {
          name: "unknown",
        };
    }
  }
  res.json(data);
};

app.route("/travellers").put(travellers);

let error;
app.get(
  "/_api/get-tests",
  cors(),
  (req, res, next) => {
    if (error || process.env.SKIP_TESTS)
      return res.json({ status: "unavailable" });
    next();
  },
  (req, res, next) => {
    if (!_report) return next();
    res.json(testFilter(_report, req.query.type, req.query.n));
  },
  (req, res) => {
    on("done", report => {
      process.nextTick(() =>
        res.json(testFilter(_report, req.query.type, req.query.n))
      );
    });
  }
);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${process.env.PORT}`);
  if (!process.env.SKIP_TESTS) {
    console.log("Running Tests...");
    setTimeout(() => {
      try {
        run();
      } catch (e) {
        error = e;
        console.log("Tests are not valid:");
        console.log(error);
      }
    }, 1500);
  }
});

export default app; // for testing

function testFilter(tests, type, n) {
  let out;
  switch (type) {
    case "unit":
      out = tests.filter(t => t.context.match("Unit Tests"));
      break;
    case "functional":
      out = tests.filter(
        t => t.context.match("Functional Tests") && !t.title.match("#example")
      );
      break;
    default:
      out = tests;
  }
  if (n !== undefined) {
    return out[n] || out;
  }
  return out;
}
