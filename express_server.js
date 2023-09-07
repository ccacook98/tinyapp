const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  //Generate a random six-character string. There's no good way to do this in JS without resorting to the use of a complex one-liner like this. Sorry...
  return Math.round((Math.pow(36, 6 + 1) - Math.random() * Math.pow(36, 6))).toString(36).slice(1);
};

//Scan over the user database and return the user ID that is registered to the given email address. This also isn't the most efficient way of doing things, but the 'correct' solution is outside the scope of this project.
const getUserByEmail = function(email, userDatabase) {
  for(const user in userDatabase) {
    console.log(userDatabase[user]);
    if(userDatabase[user]["email"] === email) {
      return user;
    }
  }
  //This will only execute if the above doesn't already return.
  return null;
}

//Enable the EJS view engine
app.set("view engine", "ejs");

//Initial definition for the URL database. This will be added to by the form at /urls/new
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
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
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user,
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
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user,
    urls: urlDatabase
    // ... any other vars
  };
  //Check if the user is logged in and verify the user ID against the database
  if (user.id === req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  }
  else {
    //If the user isn't logged in or the given user ID doesn't exist, redirect to the login page
    res.redirect("/login");
  }
});

//Display information for the URL referenced by the specified key.
app.get("/urls/:id", (req, res) => {
  const userID = users[req.cookies["user_id"]];
  const templateVars = {
    user: userID,
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

//Handle redirects to the long URL
app.get("/u/:id", (req, res) => {
  //Test to see if the given short URL exists in the database
  if (urlDatabase[req.params.id]) {
    res.redirect(urlDatabase[req.params.id]);
  }
  else {
    //Send a 404 error if there is no such URL
    res.status(404).send("The short URL you have requested is not in service at this time. Please check the URL and try again.");
  }
});

app.post("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  //Check if the user is logged in and verify the user ID against the database
  if (users[userID].id === userID) {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  }
  else {
    res.status(403).send("Access denied: You must log in to register a new URL.");
  }
});

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  //Check if a user is already logged in; if so, redirect to the URLs page
  if (users[userID].id === userID) {
    res.redirect("/urls");
  }
  else {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_registration", templateVars);
  }
});

app.post("/register", (req, res) => {
  //Check for a blank username or password; return an error if so
  if (!req.body.email || !req.body.password) {
    res.status(400).send("The username and/or password fields must not be blank.");
    //Check if an existing user already has this email address; return an error if so
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("An account with this email address already exists.");
  } else {
    //Otherwise, add the username and password to the user database along with a random user ID
    const rndID = generateRandomString();
    users[rndID] = {
      id: rndID,
      email: req.body.email,
      password: req.body.password,
    }
    res.cookie("user_id", rndID);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  //Check if a user is already logged in; if so, redirect to the URLs page
  if (users[userID]) {
    res.redirect("/urls");
  }
  //Otherwise give them the login form
  else {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => {
  userID = getUserByEmail(req.body.email, users);
  if(!userID || (req.body.password !== users[userID]["password"])) {
    console.log(users[userID]);
    res.status(400).send("The username or password you have entered is incorrect. Please try again.");
  } else {
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
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
