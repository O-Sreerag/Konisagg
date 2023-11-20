const userModel = require('../models/userModel')

const userLoginStatusTrue = (req, res, next) => {
  console.log("user login status middleware")
  console.log("login status" + req.session?.verifiedUser?.loginStatus)
  
  if (req.session.verifiedUser) {
    res.redirect('/')
  } else {
    next()
  }
}

const userLoginStatusFalse = (req, res, next) => {
  console.log("user login status middleware")
  console.log("login status" + req.session?.verifiedUser?.loginStatus)

  if (!req.session.verifiedUser) {
    res.redirect('/login')
  } else {
    next()
  }
}


module.exports = {userLoginStatusTrue,userLoginStatusFalse}

// if login redirect to home else to next
// if not login redirect to login or next