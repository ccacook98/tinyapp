const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
app.use(cookieSession({
  name: 'session',
  secret: 'RoO\\Qu9m^ZBgjL.z^op*',
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
const PORT = 8080; // default port 8080
const utils = require("./helpers");

//Enable the EJS view engine
app.set("view engine", "ejs");

//Initial definition for the URL database. This will be added to by the form at /urls/new
let urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "uixlfk" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "uixlfk" }
};

//Initial definition for the user database. This is added to every time a user registers at /register
let users = {
  uixlfk: {
    id: "uixlfk",
    email: "user@example.com",
    password: "$2a$10$1bTBM4OfWMLnZeApCtUA0.dbJ0N2hVH9rbYAsoaEB87yKVmNnGUjy"
  },
  zgg8m: {
    id: "zgg8m",
    email: "user2@example.com",
    password: "$2a$10$xDsMLMoxDhp3G8.NuMLRbupsP30TDGSCIXU7h5IYPTEzk2M8BKeW.",
  },
};

//Enable extended URL-encoded POST requests
app.use(express.urlencoded({ extended: true }));

//Handle requests for the root directory
app.get("/", (req, res) => {
  //Send users who wind up here to the login form
  res.redirect("/login");
});

//Handler for dumping the URL database in machine-readable JSON form
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Handler for displaying all registered URLs owned by current user in human-readable HTML form
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  //Check if user is logged in before proceeding
  if (user) {
    const templateVars = {
      user: user,
      urls: utils.urlsForUser(user.id, urlDatabase)
    // ... any other vars
    };
    res.render("urls_index", templateVars);
  } else {
    //User isn't logged in, so ask them to
    res.redirect("/login");
  }
});

//Handle POST requests to add URLs to the database
app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  //Check if the user is logged in
  if (users[user] && users[user].id === user) {
    //generate a new random ID
    const rndString = utils.generateRandomString();
    //add a new property to urlDatabase with the random string as key and our URL and user ID as values
    urlDatabase[rndString] = { longURL: req.body.longURL, userID: user };
    //Once done, redirect the user to the page showing the details of their entry.
    res.redirect('/urls/' + rndString);
  } else {
    //Fail with a 403 response code
    res.status(403).send("Access denied: You must log in to register a new URL.");
  }
});

//Handler for the /urls/new form which allows new entries to be added.
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user: user,
    urls: urlDatabase
    // ... any other vars
  };
  //Check if the user is logged in and verify the user ID against the database
  if (user && user.id === req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    //If the user isn't logged in or the given user ID doesn't exist, redirect to the login page
    res.redirect("/login");
  }
});

//Display information for the URL referenced by the specified key.
app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  //Check if the current user is logged in and owns this URL
  if (user && user.id === urlDatabase[req.params.id].userID) {
    const templateVars = {
      user: user,
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
    };
    res.render("urls_show", templateVars);
  } else if (!user) {
    //If the user is not logged in, send a 403
    res.status(403).send("Access denied: You must log in to view URL details.");
  } else {
    //If we get here, we can safely assume the user is logged in but does not have access
    res.status(403).send("Access denied: You do not own this URL.");
  }
});

//Handle redirects to the long URL
app.get("/u/:id", (req, res) => {
  //Test to see if the given short URL exists in the database
  if (urlDatabase[req.params.id]) {
    res.redirect(urlDatabase[req.params.id].longURL);
  } else {
    //Send a 404 error if there is no such URL
    res.status(404).send("The short URL you have requested is not in service at this time. Please check the URL and try again.");
  }
});

//Handle updating an existing URL. This is used by the form at /urls/:id.
app.post("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  //Check if the user is logged in and verify the user owns this URL
  if (user && urlDatabase[req.params.id].userID === user.id) {
    //Overwrite the target for this URL in the database
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else if (user) {
    //User is logged in but does not own this URL
    res.status(403).send("Access denied: You do not own this URL.");
  } else {
    //User isn't logged in or something unexpected happened
    res.status(403).send("Access denied: You must log in to register a new URL.");
  }
});

//Handle requests for the registation form
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  //Check if a user is already logged in; if so, redirect to the URLs page
  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_registration", templateVars);
  }
});

//POST handler for registering new users
app.post("/register", (req, res) => {
  //Check for a blank username or password; return an error if so
  if (!req.body.email || !req.body.password) {
    res.status(400).send("The username and/or password fields must not be blank.");
    //Check if an existing user already has this email address; return an error if so
  } else if (utils.getUserByEmail(req.body.email, users)) {
    res.status(400).send("An account with this email address already exists.");
  } else {
    //Otherwise, add the username and password to the user database along with a random user ID
    const rndID = utils.generateRandomString();
    users[rndID] = {
      id: rndID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    };
    req.session.user_id = rndID;
    res.redirect("/urls");
  }
});

//Handler for generating the login form
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  //Check if a user is already logged in; if so, redirect to the URLs page
  if (user) {
    res.redirect("/urls");
  } else {
    //Otherwise give them the login form
    const templateVars = { user: user };
    res.render("urls_login", templateVars);
  }
});

//Handler for POSTs from the login form
app.post("/login", (req, res) => {
  //Look up the relevant user ID from the database
  const user = utils.getUserByEmail(req.body.email, users);
  //Check if the user exists and the provided password matches the hash in the database
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    //Set a session cookie and redirect the user to the URL list
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    //Otherwise, send an error message
    res.status(400).send("The username or password you have entered is incorrect. Please try again.");
  }
});

//Handler for the logout function
app.post("/logout", (req, res) => {
  //Remove the session cookie and redirect to the login form
  req.session = null;
  res.redirect("/login");
});

//Handler for the delete function
app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
  //Check if the user is logged in and verify the user owns this URL
  if (user && urlDatabase[req.params.id].userID === user.id) {
    //Delete the URL from the database and redirect back to the URL listing
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else if (!user) {
    //User attempted to delete a URL that wasn't theirs
    res.status(403).send("Access denied: You must log in to delete this URL.");
  } else {
    //We can safely assume the user is logged in but doesn't own the URL
    res.status(403).send("Access denied: You do not own this URL.");
  }
});

//Start listening on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
