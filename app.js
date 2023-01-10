require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require("mongoose-findOrCreate")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require("passport-facebook");

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(process.env.URL_MONGOOSE);

const userschema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  facebookId:String,
  secret:String
});
userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);
const User=mongoose.model("user",userschema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    // ,userProfileUrl:"https://googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });

app.get("/",(req,res)=>{
  res.render("Home");
});

app.get("/login",(req,res)=>{
  res.render("Login");
});

app.get("/register",(req,res)=>{
  res.render("Register");
});
app.get("/secrets",(req,res)=>{
  User.find({secret:{$ne:null}},(err,foundsecrets)=>{
    if(err) throw err
    res.render("secrets",{allsecrets:foundsecrets});
  });
});
app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
      if(err){
        console.log(err);
        res.redirect("/register");
      }
      else{
        passport.authenticate("local")(req,res,()=>{
          res.redirect("/secrets");
        });
      }
    });
});

app.post("/login",(req,res)=>{
  const newuser=new User({
    email:req.body.username,
    password:req.body.password
  });
  req.login(newuser,(err)=>{

      passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets");
      });

  });
});

app.get("/submit",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/submit",(req,res)=>{
  const submittedsecret=req.body.secret;
  User.findById(req.user.id,(err,f_user)=>{
    if(err){console.log(err);}
    else{
      if(f_user)
      {
        f_user.secret=submittedsecret;
        f_user.save(()=>{
          res.redirect("/secrets");
        });
      }
    }
  });

});

app.get("/logout",(req,res)=>{
  req.logout((err)=>{
    if(err) throw err
    res.redirect("/");
  });

});



app.listen(process.env.PORT||3000,()=>{
  console.log("connected to server 3000");
});
