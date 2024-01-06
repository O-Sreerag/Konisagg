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

const userBlockStatus = async (req, res, next) => {
  try{
    console.log("user block status checking middleware")

    var blockStatus = true
    if(req.session.verifiedUser) {
      const userEmail = req.session?.verifiedUser?.useremail
      console.log("user exists and useremail is :" + userEmail)

      const user = await userModel.findOne({useremail: userEmail})
      console.log(user)

      if(user && user.status == true){
        console.log("user is not blocked")
        blockStatus = true
      } else {
        console.log("user is blocked")
        blockStatus = false
      }
    }
    
    if(blockStatus) {
      next()
    } else {
      if(req.session.verifiedUser){
        req.session.verifiedUser = null
      }
      req.session.Message ="You have been blocked. and there by donot have access to this operation"
      res.redirect('/')
    }
    
  }catch (error) {
    console.log(error)
    res.status(500).send('Internal Server Error');
  }
}


module.exports = {userLoginStatusTrue,userLoginStatusFalse, userBlockStatus}

// if login redirect to home else to next
// if not login redirect to login or next