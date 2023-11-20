const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const sendOtp = require('../helpers/otp')



// user get home page
const userHome = async (req, res, next) => {
  console.log("userhome");

  console.log("req.session.verifiedUser :")
  console.log(req.session.verifiedUser)
  const products = await productModel.find()
  console.log("products :")
  console.log(products)

  const parentCategories = await categoryModel.aggregate([
    {
      $match: { tier: 1 } 
    },
    {
      $lookup: {
        from: 'categoryinfos', 
        localField: 'subCategories',
        foreignField: '_id',
        as: 'subCategoriesData' 
      }
    },
    {
      $project: {
        name: 1,  
        image: 1, 
        subCategoriesData: {
          _id: 1,
          name: 1, 
          products: 1 
        }
      }
    }
  ]);
  console.log("parent categories")
  console.log(parentCategories);  

  res.render('user/index', 
  { loginStatus: req.session?.verifiedUser?.loginStatus,
    username: req.session?.verifiedUser?.username,
    productList: products,
    categories: parentCategories
  })
}



// user login via email and password or OTP
const login = (req, res, next) => {
  console.log("login")

  res.render('user/user-login', { error: req.session?.user?.loginError })
  if (req.session && req.session.user) {
    req.session.user.loginError = null;
  }
}

const loginSubmit = async (req, res, next) => {
  try {
    console.log("login/submit")

    const { useremail, userpassword } = req.body;
    console.log({ useremail, userpassword });
    req.session.user = {
      email: req.body.useremail
    };

    const user = await userModel.findOne({ useremail });
    console.log(user);
    if (user) {
      if (user.userpassword === userpassword) {
        let verifiedId = user._id
        let verifiedEmail = user.useremail;
        let verifiedName = user.username;
        let verifiedPassword = user.userpassword;

        // Destroy the session and clear the cookie
        console.log(req.session.user)
        req.session.user = null
        res.clearCookie('connect.sid');

        // Reinitialize req.session.user
        req.session.verifiedUser = {
          userid: verifiedId,
          useremail: verifiedEmail,
          username: verifiedName,
          userpassword: verifiedPassword,
          loginStatus: true,
          status: true,
          verified: true
        };

        res.redirect('/');
      } else {
        req.session.user.loginError = "incorrect password";
        res.redirect('/login');
      }
    } else {
      req.session.user.loginError = "incorrect email";
      res.redirect('/login');
    }
  } catch (error) {
    console.log(error);
  }
}

const otpLogin = (req, res, next) => {
  console.log("otplogin")

  res.render('user/user-otp-login', { error: req.session?.user?.otpLoginEmailError })
  if (req.session && req.session.user) {
    req.session.user.otploginEmailError = null;
  }
}

const otpLoginSubmit = async (req, res, next) => {
  try {
    console.log("otplogin/submit")

    const useremail = req.body.useremail
    console.log(useremail)

    const user = await userModel.findOne({ useremail });
    if (user) {
      req.session.user = {
        email: useremail
      }

      let generatedotp = Math.floor(100000 + Math.random() * 900000)
      req.session.user.otp = generatedotp;
      console.log(req.session.user)

      sendOtp(req.session.user.email, req.session.user.otp)
      res.redirect('/otplogin~otp')

    } else {
      req.session.user.otpLoginEmailError = "invalid email"
      res.redirect('/otplogin')
    }

  } catch (error) {
    console.log(error)
  }
}

const otpLoginOtp = async (req, res, next) => {
  console.log("otplogin~otp")

  res.render('user/user-otp-login-submit', { error: req.session?.user?.otpLoginOtpError })
  if (req.session && req.session.user) {
    req.session.user.otploginOtpError = null;
  }
}

const otpLoginOtpSubmit = async (req, res, next) => {
  console.log("otplogin~otp/submit")

  let generatedotp = req.session.user.otp;
  console.log(generatedotp);
  console.log(req.body.signinotp);

  if (parseInt(req.body.signinotp) === generatedotp) {

    let verifiedEmail = req.session.user.email;
    const user = await userModel.findOne({ useremail: verifiedEmail })
    console.log(user)

    // Destroy the session and clear the cookie
    console.log(req.session.user)
    req.session.user = null
    res.clearCookie('connect.sid');

    // Reinitialize req.session.user
    req.session.verifiedUser = {
      userid: user._id,
      username: user.username,
      useremail: verifiedEmail,
      loginStatus: true,
      status: true,
      verified: true
    };

    res.redirect('/');
  } else {
    req.session.user.otpLoginOtpError = "invalid otp";
    res.redirect('/otplogin~otp');
  }
}



// user signup, verifying email via OTP
const userSignup = (req, res, next) => {
  console.log("signup")

  res.render('user/user-signup')
}

const userSignupSubmit = (req, res, next) => {
  try {
    console.log("signup/submit")

    req.session.user = {
      name: req.body.username,
      email: req.body.useremail,
      password: req.body.userpassword
    }
    
    let generatedotp = Math.floor(100000 + Math.random() * 900000)
    req.session.user.otp = generatedotp;
    console.log(req.session.user)
    sendOtp(req.session.user.email, req.session.user.otp)

    res.redirect('/signup/otp')
  } catch (error) {
    console.log(error);
  }
}

const userSignupOtp = (req, res, next) => {
  console.log("signup/otp")

  res.render('user/user-signup-otp', { error: req.session?.user?.signupOtpError })
  if (req.session && req.session.user) {
    req.session.user.signupOtpError = null;
  }
}

const userSignupOtpSubmit = async (req, res, next) => {
  try {
    console.log("signup/otp/submit")

    let generatedotp = req.session.user.otp;
    console.log(generatedotp);
    console.log(req.body.signupotp);
  
    if (parseInt(req.body.signupotp) === generatedotp) {
      let verifiedEmail = req.session.user.email;
      let verifiedName = req.session.user.name;
      let verifiedPassword = req.session.user.password;

      // Destroy the session and clear the cookie
      console.log(req.session.user)
      req.session.user = null
      res.clearCookie('connect.sid');


      // Reinitialize req.session.user
      req.session.verifiedUser = {
        username: verifiedName,
        useremail: verifiedEmail,
        userpassword: verifiedPassword,
        loginStatus: true,
        status: true,
        verified: true
      };
      const resp = await userModel.insertMany([req.session.verifiedUser])
      
      console.log(resp)
      req.session.verifiedUser.userid = resp[0]._id
      console.log(req.session.verifiedUser)

      res.redirect('/');
    } else {
      req.session.user.signupOtpError = "invalid otp";
      res.redirect('/signup/otp');
    }
  } catch(error) {
    console.log(error)
  }
}



// user logout
const userLogout = (req, res, next) => {
  try {
    req.session.destroy()
    res.clearCookie('connect.sid')
    res.redirect('/')
  } catch (error) {
    console.log(error);
  }
}



// edit user Profile
const accountViewProfile = async(req, res, next) => {
  try {
    console.log("view profile")
    console.log(req.session.verifiedUser)
    const userDetails = await userModel.find({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    res.render('user/settings-account-viewProfile', {user: userDetails[0]})
  } catch(error) {
    console.log(error)
  }
}

const accountEditProfile = async(req, res, next) => {
  try {
    console.log("edit profile")
    console.log(req.session.verifiedUser)
    const userDetails = await userModel.find({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    res.render('user/settings-account-editProfile', {user: userDetails[0]})
  } catch(error) {
    console.log(error)
  }
}

const accountEditProfileSubmit = async(req, res, next) => {
  try {
    const {username, useremail, userphone} = req.body
    const userimage = req.file
    const {state, district, city, pin, house} = req.body
    const useraddress = {state, district, city, pin, house}
    console.log("userdetails in submit") 
    console.log({username, useremail, userphone, useraddress},userimage)
    
    const filter = { useremail: useremail };
    const update = {
      $set: {
        username: username,
        userphone: userphone,
        useraddress: useraddress,
        userimage: userimage ? userimage.filename : null,
      },
    };

    // Perform the update operation
    const result = await userModel.updateOne(filter, update);

    res.send('image added successfully')
  } catch(error) {
    console.log(error)
  }
}

const accountEditEmail = async(req, res) => {
  try {
    
  } catch(error) {
    console.log(error)
  }
} 

const accountNotifications = (req, res, next) => {
  res.render('user/settings-account-notifications')
}

const accountSecurity = (req, res, next) => {
  res.render('user/settings-account-security')
}




module.exports = {
  userHome,
  login,
  loginSubmit,
  otpLogin,
  otpLoginSubmit,
  otpLoginOtp,
  otpLoginOtpSubmit,
  userSignup,
  userSignupSubmit,
  userSignupOtp,
  userSignupOtpSubmit,
  userLogout,

  accountViewProfile,
  accountEditProfile,
  accountEditProfileSubmit,
  accountEditEmail,
  accountNotifications,
  accountSecurity,
}