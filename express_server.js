const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  //Generate a random six-character string. There's no good way to do this in JS without resorting to the use of a complex one-liner like this. Sorry...
  return Math.round((Math.pow(36, 6 + 1) - Math.random() * Math.pow(36, 6))).toString(36).slice(1);
};

//Enable the EJS view engine
app.set("view engine", "ejs");

//Initial definition for the URL database. This will be added to by the form at /urls/new
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Enable extended URL-encoded POST requests
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

//Handler for dumping the URL database in machine-readable JSON form
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Handler for displaying all registered URLs in human-readable HTML form
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
    // ... any other vars
  };
  res.render("urls_index", templateVars);
});

//Handle POST requests to add URLs to the database
app.post("/urls", (req, res) => {
  //generate a new random ID
  const rndString = generateRandomString();
  //add a new property to urlDatabase with the random string as key and our URL as value
  urlDatabase[rndString] = req.body.longURL;
  //Once done, redirect the user to the page showing the details of their entry.
  res.redirect('/urls/' + rndString);
});

//Handler for the /urls/new form which allows new entries to be added.
app.get("/urls/new", (req, res) => {
/*  const templateVars = {
    username: req.cookies["username"],
    // ... any other vars
  };*/
  res.render("urls_new");
});

//Display information for the URL referenced by the specified key.
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

//Handle redirects to the long URL
app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

//Start listening on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
