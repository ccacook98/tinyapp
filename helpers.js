const generateRandomString = function() {
  //Generate a random six-character string. There's no good way to do this in JS without resorting to the use of a complex one-liner like this. Sorry...
  return Math.round((Math.pow(36, 6 + 1) - Math.random() * Math.pow(36, 6))).toString(36).slice(1);
};

//Scan over the user database and return the user ID that is registered to the given email address. This also isn't the most efficient way of doing things, but the 'correct' solution is outside the scope of this project.
const getUserByEmail = function(email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user]["email"] === email) {
      //Return the first user object that has a matching email address
      return userDatabase[user];
    }
  }
  //This will only execute if the above doesn't already return.
  return undefined;
};

const urlsForUser = function(id, urlDatabase) {
  let urls = [];
  //Scan the URL database and populate an array with every one that matches the given UID
  //This creates a copy of the DB containing only the ones the user owns.
  for (const urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === id) {
      //create a corresponding URL object in the new array
      urls[urlID] = urlDatabase[urlID];
    }
  }
  return urls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};
