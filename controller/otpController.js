const otpGenerator = require('otp-generator');
const OTP = require('../model/otp');
const User = require('../model/user_model');
const Wallet = require('../model/wallet');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');



const sendOTP = async (req, res) => {
    try {
      const { username, email, password, referralCode } = req.body;
      console.log('OTP Controller hit!');
      console.log(req.body)
      const checkUserPresent = await User.findOne({ email });
      if (checkUserPresent) {
        return res.status(401).json({
          success: false,
          message: 'User is already registered',
        });
      }
      let otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      }); 
      let result = await OTP.findOne({ otp: otp });
      while (result) {
        otp = otpGenerator.generate(6, { upperCaseAlphabets: false });
        result = await OTP.findOne({ otp: otp });
      }
      req.session.userData = { username, email, password };
      if (referralCode) {
      req.session.userData.referralCode = referralCode;
      }
      req.session.otp = otp;

      const otpPayload = { email, otp };
      const otpBody = await OTP.create(otpPayload);
      await sendVerificationEmail(email, otp);
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please verify.',
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  };
  

const sendVerificationEmail=async function (email, otp) {
    try {
      const mailResponse = await mailSender(
        email,
        "Verification Email",
        `<h1>Please confirm your OTP</h1>
         <p>Here is your OTP code: ${otp}</p>`
      );
      console.log("Email sent successfully: ", mailResponse);
    } catch (error) {
      console.log("Error occurred while sending email: ", error);
      throw error;
    }
  }

  const sendForgotOTP = async (req, res) => {
    try {
      const { email } = req.body; 
      console.log('Forgot OTP Controller hit!');
      console.log(req.body); 
      const checkUserPresent = await User.findOne({ email });
      if (!checkUserPresent) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please check the email address and try again.',
        });
      }

      let otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
  
      let result = await OTP.findOne({ otp: otp });
      while (result) {
        otp = otpGenerator.generate(6, { upperCaseAlphabets: false });
        result = await OTP.findOne({ otp: otp });
      }
  
      req.session.otp = otp;
      req.session.user=email
      const otpPayload = { email, otp };
      await OTP.create(otpPayload); 
      await sendVerificationEmail(email, otp); 
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email to verify.',
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  };






const generateTransactionId = () => {
  const nums = '0123456789';
  let transactionId = 'TNR';
  for (let i = 0; i < 5; i++) {
    transactionId += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return transactionId;
};





const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  for (let i = 0; i < 8; i++) {
    referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return referralCode;
};




const verifyOTP = async (req, res) => {
  const { otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email: req.session.userData.email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    let referralCode;
    let referralCodeExists = true;
    while (referralCodeExists) {
      referralCode = generateReferralCode();
      const existingReferralCode = await User.findOne({ referralCode });
      referralCodeExists = existingReferralCode !== null;
    }

    const hashedPassword = await bcrypt.hash(req.session.userData.password, 10);
    const newUser = new User({
      username: req.session.userData.username,
      email: req.session.userData.email,
      password: hashedPassword,
      referralCode, 
    });
    await newUser.save();

    if (req.session.userData.referralCode) {
      const referringUser = await User.findOne({ referralCode: req.session.userData.referralCode });

      if (referringUser) {
        let referringUserWallet = await Wallet.findOne({ userId: referringUser._id });
        if (!referringUserWallet) {
          referringUserWallet = new Wallet({ userId: referringUser._id, balance: 0, transactions: [] });
        }
        const refTransactionId = generateTransactionId();
        referringUserWallet.balance += 100;
        referringUserWallet.transactions.push({
          type: 'credit',
          amount: 100,
          uniqueTransactionId: refTransactionId,
          description: 'Referral bonus for referring a new user.',
        });
        await referringUserWallet.save();

        const newUserTransactionId = generateTransactionId();
        const newUserWallet = new Wallet({
          userId: newUser._id,
          balance: 100,
          transactions: [
            {
              type: 'credit',
              amount: 100,
              uniqueTransactionId: newUserTransactionId,
              description: 'Welcome bonus for using referral code.',
            },
          ],
        });
        await newUserWallet.save();
      }
    } else {
      const newUserWallet = new Wallet({
        userId: newUser._id,
        balance: 0,
        transactions: [],
      });
      await newUserWallet.save();
    }

    await OTP.deleteOne({ email: req.session.userData.email });
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };
    res.redirect('/user/user_home');
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};



const verifyForgotOTP = async (req, res) => {
  const { otp } = req.body; 

  try {
    const otpRecord = await OTP.findOne({ email: req.session.user, otp });
    if (!otpRecord) {
      return res.render('user/forgototp', {
        message: 'Invalid or expired OTP. Please try again.',
      });
    }

    await OTP.deleteOne({ email: req.session.user });

    res.render('user/resetPassword')
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the OTP. Please try again later.',
    });
  }
};










  const resendOTP = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.status(400).render('user/user_otp', { message: 'Session expired. Please restart the process.' });
        }
        const { email } = req.session.userData;
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        let result = await OTP.findOne({ otp });
        while (result) {
            otp = otpGenerator.generate(6, { upperCaseAlphabets: false });
            result = await OTP.findOne({ otp });
        }
        await OTP.findOneAndUpdate(
            { email },
            { otp },
            { upsert: true, new: true } 
        );
        req.session.otp = otp;
        await sendVerificationEmail(email, otp);
        res.render('user/user_otp', { message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.log('Error in resendOTP: ', error.message);
        res.status(500).render('user/user_otp', { message: 'Failed to resend OTP. Please try again.' });
    }
};



module.exports = {
    sendOTP,
    sendVerificationEmail,
    verifyOTP,
    resendOTP,
    sendForgotOTP,
    verifyForgotOTP
}