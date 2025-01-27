
const user_model=require('../model/user_model')

const checkSession=(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/user/user_login')
    }
}
const isLogin=(req,res,next)=>{
    if(req.session.user){
        res.redirect('/user/user_home')
    }else{
        next()
    }
}

const checkUserInDatabase = async (req, res, next) => {
    if (req.session.user) {
      try {
        const user = await user_model.findById(req.session.user.id); // Check if the user exists in the database
        if (user) {
          return next(); // Proceed if user exists
        } else {
          req.session.destroy(); 
          return res.redirect('/user/user_login'); // Redirect to login if user is not found
        }
      } catch (error) {
        console.error('Error checking user in database:', error);
        return res.redirect('/user/user_login'); // Redirect to login on error
      }
    } else {
      return res.redirect('/user/user_login'); // Redirect if no session
    }
  };
  

  const checkBlockedStatus = async (req, res, next) => {
    // Check if the user is logged in
    if (req.session.user) {
        try {
            // Find the user in the database using the email stored in session
            const user = await user_model.findOne({ email: req.session.user.email });

            // Check if the user is found and if the account is blocked
            if (user && user.isBlocked) {
                // If the user is blocked, redirect to login with a message
                return res.render('user/user_login', { message: 'Your account has been blocked. Please contact support.' });
            }
            
            // If the user is logged in and not blocked, proceed to the next middleware or route handler
            next();

        } catch (error) {
            console.log("Error fetching user from DB:", error);
            return res.render('user/user_login', { message: 'An error occurred while checking your account status.' });
        }
    } else {
        // If no user is logged in, redirect to the login page
        return res.redirect('/user/user_login');
    }
};





module.exports={checkSession, 
  isLogin,
  checkUserInDatabase,
  checkBlockedStatus
}