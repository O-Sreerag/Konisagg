const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const productOfferModel = require('../models/productOfferModel')
const categoryModel = require('../models/categoryModel')
const categoryOfferModel = require('../models/categoryOfferModel')
const wishlistModel = require('../models/wishlistModel')
const cartModel = require('../models/cartModel')
const bannerModel = require('../models/bannerModel')
const sendOtp = require('../helpers/otp')

const bcrypt = require('bcrypt');



// user get home page
const userHome = async (req, res, next) => {
  console.log("userhome");

  console.log("req.session.verifiedUser :")
  const user = req.session.verifiedUser
  console.log(user)
  const products = await productModel.find({status: true}).limit(8)
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
  
  const allCategories = await categoryModel.find({})
  console.log("all categories")
  console.log(allCategories)

  let wishlistItemCount, cartItemCount  
  if(user?.userid) {
    const wishlist = await wishlistModel.findOne({ userId: user?.userid})
    const cart = await cartModel.findOne({ userId: user?.userid})
    console.log("wishlist & cart")
    console.log(wishlist + "\n" + cart)
    
    wishlistItemCount = wishlist?.productIds?.length || 0
    cartItemCount = cart?.products?.length || 0
  }
  console.log(wishlistItemCount + " " + cartItemCount)

  const productOffer = await productOfferModel.findOne({})
  const categoryOffer = await categoryOfferModel.findOne({})

  const banners = await bannerModel.find({})
  console.log(banners)

  res.render('user/index', 
  { loginStatus: req.session?.verifiedUser?.loginStatus,
    username: req.session?.verifiedUser?.username,
    userimage: req.session?.verifiedUser?.userimage,
    productList: products,
    parentCategories: parentCategories,
    allCategories: allCategories,
    productOffer: productOffer,
    categoryOffer: categoryOffer,
    wishlistItemCount: wishlistItemCount,
    cartItemCount: cartItemCount,
    banners: banners,
    Message: req.session?.Message,
  })

  if(req.session.Message) {
    req.session.Message = null
  }
}



// user login via email and password or OTP
const login = (req, res, next) => {
  console.log("login")

  res.render('user/user-login', { error: req.session?.passwordResetUser?.loginError })
  if (req.session && req.session.passwordResetUser) {
    req.session.passwordResetUser.loginError = null;
  }
}

const loginSubmit = async (req, res, next) => {
  try {
    console.log("login/submit")

    const { useremail, userpassword } = req.body;
    console.log({ useremail, userpassword });
    req.session.passwordResetUser = {
      email: req.body.useremail
    };

    const user = await userModel.findOne({ useremail });
    console.log(user);
    if (user) {
      const hashedPasswordFromDB = user.userpassword;
      const passwordMatch = await bcrypt.compare(userpassword, hashedPasswordFromDB);
      if (passwordMatch) {
        let verifiedId = user._id
        let verifiedEmail = user.useremail;
        let verifiedName = user.username;
        let verifiedPassword = user.userpassword;
        let verifiedImage = user?.userimage;

        // Destroy the session and clear the cookie
        console.log(req.session.passwordResetUser)
        req.session.passwordResetUser = null
        res.clearCookie('connect.sid');

        // Reinitialize req.session.passwordResetUser
        req.session.verifiedUser = {
          userid: verifiedId,
          useremail: verifiedEmail,
          username: verifiedName,
          userpassword: verifiedPassword,
          userimage: verifiedImage,
          loginStatus: true,
          status: true,
          verified: true
        };

        res.redirect('/');
      } else {
        req.session.passwordResetUser.loginError = "incorrect password";
        res.redirect('/login');
      }
    } else {
      req.session.passwordResetUser.loginError = "incorrect email";
      res.redirect('/login');
    }
  } catch (error) {
    console.log(error);
  }
}

const otpLogin = (req, res, next) => {
  console.log("otplogin")

  res.render('user/user-otp-login', { error: req.session?.passwordResetUser?.otpLoginEmailError })
  if (req.session && req.session.passwordResetUser) {
    req.session.passwordResetUser.otploginEmailError = null;
  }
}

const otpLoginSubmit = async (req, res, next) => {
  try {
    console.log("otplogin/submit")

    const useremail = req.body.useremail
    console.log(useremail)

    const user = await userModel.findOne({ useremail });
    if (user) {
      req.session.passwordResetUser = {
        email: useremail
      }

      let generatedotp = Math.floor(100000 + Math.random() * 900000)
      req.session.passwordResetUser.otp = generatedotp;
      console.log(req.session.passwordResetUser)

      sendOtp(req.session.passwordResetUser.email, req.session.passwordResetUser.otp)
      res.redirect('/otplogin~otp')

    } else {
      if(!req.session.passwordResetUser) {
        req.session.passwordResetUser = {}
      }
      req.session.passwordResetUser.otpLoginEmailError = "invalid email"
      res.redirect('/otplogin')
    }

  } catch (error) {
    console.log(error)
  }
}

const otpLoginOtp = async (req, res, next) => {
  console.log("otplogin~otp")

  res.render('user/user-otp-login-submit', { error: req.session?.passwordResetUser?.otpLoginOtpError })
  if (req.session && req.session.passwordResetUser) {
    req.session.passwordResetUser.otploginOtpError = null;
  }
}

const otpLoginOtpSubmit = async (req, res, next) => {
  console.log("otplogin~otp/submit")

  let generatedotp = req.session.passwordResetUser.otp;
  console.log(generatedotp);
  console.log(req.body.otp);

  if (parseInt(req.body.otp) === generatedotp) {

    let verifiedEmail = req.session.passwordResetUser.email;
    const user = await userModel.findOne({ useremail: verifiedEmail })
    console.log(user)

    let verifiedImage = user?.userimage

    // Destroy the session and clear the cookie
    console.log(req.session.passwordResetUser)
    req.session.passwordResetUser.otpLoginOtpError = null
    res.clearCookie('connect.sid');

    // Reinitialize req.session.passwordResetUser
    req.session.verifiedUser = {
      userid: user._id,
      username: user.username,
      useremail: verifiedEmail,
      userimage: verifiedImage,
      loginStatus: true,
      status: true,
      verified: true
    };

    res.redirect('/');
  } else {
    req.session.passwordResetUser.otpLoginOtpError = "invalid otp";
    res.redirect('/otplogin~otp');
  }
}

// user password verification
const userPasswordReset = async (req, res) => {
  try {
    console.log("user password reset email verification get")

    res.render('user/password-reset', {Error: req.session.passwordResetError})
    req.session.passwordResetError = null
  } catch (error) {
    console.log(error)
  }
}

const userPasswordResetSubmit = async (req, res) => {
  try {
    console.log("user password reset email verification submit")

    const email = req.body.useremail
    console.log(email)

    const user = await userModel.findOne({useremail: email})
    console.log(user)
    if(user) {
      console.log("user found")
      
      req.session.passwordResetUser = {
        email: email
      }

      let generatedotp = Math.floor(100000 + Math.random() * 900000)
      req.session.passwordResetUser.otp = generatedotp;
      console.log(req.session.passwordResetUser)
      
      sendOtp(req.session.passwordResetUser.email, req.session.passwordResetUser.otp)
      res.redirect('/password/reset/otp')
    } else {
      console.log("user not found")
      req.session.passwordResetError = "Invalid Email"
      res.redirect('/password/reset')
    }

  } catch (error) {
    console.log(error)
  }
}

const userPasswordResetOtp = async (req, res) => {
  try {
    console.log("user password reset otp verification get")

    res.render('user/password-reset-otp', {error: req.session.passwordResetError})
    req.session.passwordResetError = null
  } catch (error) {
    console.log(error)
  }
}

const userPasswordResetOtpSubmit = async (req, res) => {
  try {
    console.log("user password reset otp verification submit")
    
    let generatedotp = req.session.passwordResetUser.otp;
    console.log(generatedotp);
    console.log(req.body.otp);

    if (parseInt(req.body.otp) === generatedotp) {
      console.log("otp match")
        
      res.redirect('/password/reset/getNewPassword');
    }else {
      console.log("otp mismatch")
      req.session.passwordResetError = "invalid otp";
      res.redirect('/password/reset/otp');
    }
  } catch (error) {
    console.log(error)
  }
}

const userPasswordGetNewPassword = async (req, res) => {
  try {
    console.log("user password new password get")
    
    res.render('user/password-reset-getNewPassword')
  } catch (error) {
    console.log(error)
  }
}

const userPasswordGetNewPasswordSubmit = async (req, res) => {
  try {
    console.log("user password new password submit")

    console.log(req.session.passwordResetUser)
    let verifiedUserEmail = req.session.passwordResetUser.email
    let verifiedPassword = req.body.userpassword;
    console.log(verifiedPassword)

    const user = await userModel.findOne({useremail: verifiedUserEmail})
    console.log(user)

    const saltRounds = 10; 
    // Hash the password
    const hashedPassword = await bcrypt.hash(verifiedPassword, saltRounds);

    await userModel.updateOne({useremail: verifiedUserEmail},{userpassword: hashedPassword})
    console.log("password reset successfully")

    res.redirect('/login')
  } catch (error) {
    console.log(error)
  }
}

// user signup, verifying email via OTP
const userSignup = (req, res, next) => {
  console.log("signup");

  // Extract referral parameters from the query string
  const referralParams = req.query;

  // Check if the referral parameter exists and is not empty
  if (referralParams && Object.keys(referralParams).length > 0) {
    // Loop through the parameters and handle them dynamically
    for (const param in referralParams) {
      const paramName = param; // This will be 'on_Konisagg_with~user1' dynamically
      const paramValue = referralParams[paramName]; // This will be the dynamic value, e.g., '655ee66e4501bfebc164f1f4'

      // Use the dynamic parameter name and value as needed in your logic for user signup
      console.log(`Parameter Name: ${paramName}, Value: ${paramValue}`);
      req.session.referalUserId = paramValue
    }
  } else {
    delete req.session?.referalUserId;
  }

  res.render('user/user-signup')
}

const userSignupSubmit = (req, res, next) => {
  try {
    console.log("signup/submit")

    req.session.passwordResetUser = {
      name: req.body.username,
      email: req.body.useremail,
      password: req.body.userpassword
    }
    
    let generatedotp = Math.floor(100000 + Math.random() * 900000)
    req.session.passwordResetUser.otp = generatedotp;
    console.log(req.session.passwordResetUser)
    sendOtp(req.session.passwordResetUser.email, req.session.passwordResetUser.otp)

    res.redirect('/signup/otp')
  } catch (error) {
    console.log(error);
  }
}

const userSignupOtp = (req, res, next) => {
  console.log("signup/otp")

  res.render('user/user-signup-otp', { error: req.session?.passwordResetUser?.signupOtpError })
  if (req.session && req.session.passwordResetUser) {
    req.session.passwordResetUser.signupOtpError = null;
  }
}

const userSignupOtpSubmit = async (req, res, next) => {
  try {
    console.log("signup/otp/submit")

    let generatedotp = req.session.passwordResetUser.otp;
    console.log(generatedotp);
    console.log(req.body.signupotp);
  
    if (parseInt(req.body.signupotp) === generatedotp) {
      let verifiedEmail = req.session.passwordResetUser.email;
      let verifiedName = req.session.passwordResetUser.name;
      let verifiedPassword = req.session.passwordResetUser.password;
      
      const user = await userModel.findOne({useremail: verifiedEmail})
      let verifiedImage = user?.userimage

      // Destroy the session and clear the cookie
      console.log(req.session.passwordResetUser)
      req.session.passwordResetUser = null
      res.clearCookie('connect.sid');

      // Generate a salt to hash the password
      const saltRounds = 10; 
      // Hash the password
      const hashedPassword = await bcrypt.hash(verifiedPassword, saltRounds);

      // Reinitialize req.session.passwordResetUser
      req.session.verifiedUser = {
        username: verifiedName,
        useremail: verifiedEmail,
        userpassword: hashedPassword,
        userimage: verifiedImage,
        loginStatus: true,
        status: true,
        verified: true
      };
      const resp = await userModel.create([req.session.verifiedUser])
      
      console.log(resp)
      req.session.verifiedUser.userid = resp[0]._id
      console.log(req.session.verifiedUser)

      // After successful verification and session management
      if (req.session.referalUserId) {
        console.log("refered link")

        // Update referred user's wallet with 120 rupees
        const referredUser = await userModel.findById(req.session.referalUserId);
        if (referredUser) {
          referredUser.userwallet += 120;
          await referredUser.save();
        }

        // Update the current user's wallet with 25 rupees
        const currentUser = await userModel.findById(req.session.verifiedUser.userid);
        if (currentUser) {
          currentUser.userwallet += 25;
          await currentUser.save();
        }

        delete req.session?.referalUserId;
      }

      res.redirect('/');
    } else {
      req.session.passwordResetUser.signupOtpError = "invalid otp";
      res.redirect('/signup/otp');
    }
  } catch(error) {
    console.log(error)
  }
}



// user logout
const userLogout = (req, res, next) => {
  try {
    console.log("user logout rout")

    req.session.verifiedUser = null
    res.clearCookie('connect.sid')
    res.redirect('/')
  } catch (error) {
    console.log(error);
  }
}


// edit user Profile
const accountViewProfile = async(req, res, next) => {
  try {
    console.log("get view profile rout")

    console.log(req.session.verifiedUser)
    const userDetails = await userModel.find({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    let addressMessage = req.session?.address?.message
    res.render('user/settings-account-viewProfile', {user: userDetails[0], addressMessage:addressMessage })

    if (req.session && req.session.address) {
      req.session.address.message = null;
    }
  } catch(error) {
    console.log(error)
  }
}

const accountEditProfile = async(req, res, next) => {
  try {
    console.log("get edit user profile")

    console.log(req.session.verifiedUser)
    const userDetails = await userModel.find({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    res.render('user/settings-account-editProfile', {user: userDetails[0]})
  } catch(error) {
    console.log(error)
  }
}

const accountEditProfileImage = async(req, res, next) => {
  try {
    console.log("get edit user profile image")

    console.log(req.session.verifiedUser)
    const userDetails = await userModel.find({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    res.render('user/settings-account-editProfileImage', {user: userDetails[0], message: req.session?.passwordResetUserEditProfile?.message})
    if (req.session && req.session.passwordResetUserEditProfile) {
      req.session.passwordResetUserEditProfile.message = null;
  }
  } catch(error) {
    console.log(error)
  }
}

const accountEditProfileImageSubmit = async (req, res) => {
  try {
    console.log("edit user profile image")

    const user = req.session.verifiedUser;
    const userDetails = await userModel.findOne({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    // console.log(req.file)
    // let userimage = req.file.filename
    let userimage = req.uploadedImage
    console.log(userimage)

    const updatedUser = await userModel.findOneAndUpdate(
      { useremail: user.useremail },
      { userimage: userimage },
      { new: true }
    );
    
    console.log("edited successfully")
    if (!req.session.address) {
      req.session.address = {};
    }
    req.session.address.message = "Image edited successfully"
    res.redirect('/account/view~profile')
  } catch (error) {
    console.log(error)
  }
}

const accountEditProfileDeleteImageSubmit = async (req, res) => {
  try {
    console.log("deleting image user")
 
    const user = req.session.verifiedUser;

    // Find the user by email or any unique identifier
    const userDetails = await userModel.findOne({ useremail: user.useremail });
    console.log(userDetails);

    // Update the user's image field to null or an empty value
    const updatedUser = await userModel.findOneAndUpdate(
      { useremail: user.useremail },
      { userimage: null }, // Set userimage to null (or an empty value) to delete the image
      { new: true }
    );

    console.log("Image deleted successfully");
    if (!req.session.address) {
      req.session.address = {};
    }
    req.session.address.message = "Image deleted successfully"
    res.redirect('/account/view~profile')
  } catch (error) {
    console.log(error)
  }
}

  const accountEditProfileSubmit = async(req, res, next) => {
    try {
      console.log("post edit user profile")

      const {username, useremail, userphone} = req.body
      // const userimage = req.file
      const userimage = req.uploadedImage
      const {state, district, city, pin, house} = req.body
      const useraddresses = [];
      
      if (state && state.length > 0) {
        for (let i = 0; i < state.length; i++) {
          const address = {
            state: state[i],
            district: district[i],
            city: city[i],
            pin: pin[i],
            house: house[i]
          };
          useraddresses.push(address);
        }
      }
      
      console.log("userdetails in submit") 
      console.log({username, useremail, userphone, useraddresses},userimage)

      const filter = { useremail: useremail };

      if (userimage !== undefined) {
        const update = {
            $set: {
                useraddresses: useraddresses,
                username: username,
                userphone: userphone,
                // userimage: userimage.filename,
                userimage: userimage,
            },
        };

        const result = await userModel.updateOne(filter, update);
      } else {
        const update = {
            $set: {
                useraddresses: useraddresses,
                username: username,
                userphone: userphone,
            },
        };

        const result = await userModel.updateOne(filter, update);
      }

      if (!req.session.address) {
        req.session.address = {};
      }
      req.session.address.message = "Profile edited successfully"
      res.redirect('/account/view~profile')
    } catch(error) {
      console.log(error)
    }
  }

const accountEditEmail = async(req, res) => {
  try {
    console.log("edit email get")

    res.render('/edit-email')
  } catch(error) {
    console.log(error)
  }
}
const accountEditEmailSubmit = async(req, res) => {
  try {
    console.log("edit email submit")

    res.render('/edit-email')
  } catch(error) {
    console.log(error)
  }
}
const accountEditEmailOtp = async(req, res) => {
  try {
    console.log("edit email otp get")

    res.render('/edit-email')
  } catch(error) {
    console.log(error)
  }
}
const accountEditEmailOtpSubmit = async(req, res) => {
  try {
    console.log("edit email otp submit")

    res.render('/edit-email')
  } catch(error) {
    console.log(error)
  }
}

const accountAddAddress = async (req, res, next) => {
  try {
    console.log("add or delete address user side")

    console.log(req.session.verifiedUser)
    const userDetails = await userModel.find({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)

    res.render('user/settings-account-add~address', {user: userDetails[0]})
  } catch(error) {
    console.log(error)
  }

}

const accountDeleteAddress = async (req, res, next) => {
  try {
    console.log("add or delete address user side")
    
    const addressIndex = parseInt(req.query.addressIndex);
    console.log("addressIndex")
    console.log(addressIndex)
    
    console.log(req.session.verifiedUser)
    const userDetails = await userModel.findOne({useremail: req.session.verifiedUser.useremail})
    console.log(userDetails)


    if (!userDetails) {
        return res.status(404).send('user not found.');
    }
    userDetails.useraddresses.splice(addressIndex, 1)
    await userDetails.save();

    if (!req.session.address) {
      req.session.address = {};
    }
    req.session.address.message = "address deleted successfully"
    res.redirect('/account/view~profile')

  } catch(error) {
    console.log(error)
  }
}

const accountAddAddressSubmit = async (req, res, next) => {
  try {
    console.log("add address submit")

    console.log("user")
    console.log(req.session.verifiedUser)
    const userId = req.session.verifiedUser.userid

    const {state, district, city, house, pin} = req.body
    Address = {state, district, city, house, pin}
    console.log("new address")
    console.log(Address)

    const filter = { _id: userId };
    const update = {
      $push: {
        useraddresses: {
          $each: [Address],
          $slice: -4 // Keep the last four elements
        }
      },
    };

    const result = await userModel.updateOne(filter, update);

    console.log("address added successfully")
    if (!req.session.address) {
      req.session.address = {};
    }
    req.session.address.message = "address added successfully"
    res.redirect('/account/view~profile')
  } catch(error) {
    console.log(error)
  }
}

const accountSecurity = (req, res, next) => {
  res.render('user/settings-account-security')
}


// Create a function to resend OTP
const resendOtp = (req, res) => {
  try {
    console.log("resend otp")
    const email = req.session.passwordResetUser.email; 
    console.log(email)

    if (req.session && req.session.passwordResetUser && req.session.passwordResetUser.email === email) {
      const generatedotp = Math.floor(100000 + Math.random() * 900000);
      req.session.passwordResetUser.otp = generatedotp;

      // Assuming you have a function to send OTP via email
      sendOtp(email, generatedotp);
      console.log(req.session.passwordResetUser)

      res.status(200).send('New OTP sent successfully');
    } else {
      res.status(200).send('User not found or email missing in the session');
    }
  } catch (error) {
    console.log(error);
  }
};

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
  resendOtp,
  userLogout,
  
  userPasswordReset,
  userPasswordResetSubmit,
  userPasswordResetOtp,
  userPasswordResetOtpSubmit,
  userPasswordGetNewPassword,
  userPasswordGetNewPasswordSubmit,

  accountViewProfile,
  accountEditProfile,
  accountEditProfileImage,
  accountEditProfileSubmit,
  accountEditProfileImageSubmit,
  accountEditProfileDeleteImageSubmit,
  accountEditEmail,
  accountAddAddress,
  accountDeleteAddress,
  accountAddAddressSubmit,
  accountSecurity,
}