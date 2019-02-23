var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    nodemailer = require("nodemailer"),
    User = require("./models/user"),
    Transaction = require("./models/transaction"),
    Rates = require("./models/rates"),
    tranId = 1000000;
    
    



app.set("view engine", "ejs");
app.use(express.static(__dirname + "public"));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
mongoose.connect(process.env.DATABASE_URL);



//Passport Configuration
app.use(require("express-session")({
    secret: "Study hard",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   res.locals.warning = req.flash("warning");
   next();
});

//Transporter
    var transporter = nodemailer.createTransport({
	  host: "in-v3.mailjet.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
      user: "893b037da7861aedecf74553efa0f83d", // generated ethereal user
      pass: "d632bd3ff625cbb63a6589143432e93c" // generated ethereal password
      }
  });


//Create Admin
function createAdmin(){
    User.deleteMany({isAdmin: true},function(err){
        if(err){
            console.log(err);
        }else{
            console.log("Deleted....");
            var newAdmin = new User({username: process.env.ADMIN_ID, firstName: "Administrator", isAdmin: true});
            User.register(newAdmin, process.env.ADMIN_PASS, function(err, created){
                if(err){
                    console.log(err);
                }else{
                    console.log("It worked....");
                    return true;
                }
            });
        }
    });
}
createAdmin();
//Set default rates
function setRates(){
    var temp = new Rates({
        pmbuy: 75,
        pmsell: 65,
        advbuy: 75,
        advsell: 63,
        payeerbuy: 76,
        payeersell: 65,
        paypalbuy: 75,
        paypalsell: 68
    });
    Rates.remove(function(err) {
        if(err){
            console.log(err.message);
        }else{
            console.log("Old rates deleted.");
        }
    });
    Rates.create(temp, function(err, newRates) {
        if(err){
            console.log("Some error occured \n"+ err.message);
        }else{
            console.log("Default rates set");
        }
    });
}
setRates();





//Root Route
app.get("/", function(req, res){
    Rates.findOne({isUpdated: true}, function(err, today){
       if(err || !(today)){
          console.log(err);
          req.flash("error", err.message);
          res.render("An error occured. We will be back soon...");
       }else{
           res.render("landing", {rates: today}); 
       } 
    });
   
});


//Send contact message as email
app.post("/contact", function(req, res){

	var message ="Details of Enquiry\n\n" + "Name: "+ req.body.name + "\n\nEmail: " + req.body.email  +  "\n\n Description:" + req.body.message +"\n\n You cannot reply to this mail directly to the contact.\n So Don't reply. \nCompose a new message"; 
	var mailOptions = {
  	from: {name: req.body.name, address:"vm23526@gmail.com"},
  	to: 'baby.manikantan@gmail.com',
  	subject: 'Reg: Message from website',
  	text: message,
	};
	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	  	console.log(error);
	  	req.flash("error","Message not sent...");
	  	res.redirect("/");
	  } else {
	    req.flash("success","Thank You for contacting us...We will reply to you via email....");
	  	res.redirect("/");
	  }
	}); 
    
});

//Authorisation Routes

//Display the register form
app.get("/register", function(req, res) {
   res.render("register"); 
});

//Handle register request
app.post("/register", function(req, res){
   var newUser = new User({
       username: req.body.username,
       firstName: req.body.firstName,
       email: req.body.username,
       phone: req.body.phone
   });
   User.register(newUser, req.body.password, function(err, newlyCreated){
      if(err || !(newlyCreated)){
          console.log(err);
          req.flash("error", err.message);
          res.redirect("/register");
      }else{
          passport.authenticate("local")(req, res, function(){
                req.flash("success", "Successfully registered....\n Welcome "+ newlyCreated.firstName);
                res.redirect("/"); 
          });
      } 
   });
});

//Display login form
app.get("/login", function(req, res) {
    res.render("login");
});

//Handle login request
app.post("/login", function(req, res) {
   User.findOne({username: req.body.username}, function(err, User){
        if(err || (!User)){
            console.log(err);
            req.flash("error","Username/Password is wrong....");
            return res.redirect("/login");
        }else{
            passport.authenticate("local",
            {
                  successRedirect: "/",
                  failureRedirect: "/login",
                  successFlash: "Welcome "+ User.firstName,
                  failureFlash: "Username/Password is wrong...."
                })(req, res);
        }
        }); 
});

//Handle logout request
app.get("/logout", function(req, res) {
    req.logout();
    req.flash("success","Logged you out....");
    res.redirect("/");
});

//User Dashboard
//Display new transaction form to the customer
app.get("/userd", isLoggedIn, function(req, res) {
    Rates.findOne({isUpdated: true}, function(err, today){
       if(err || !(today)){
           console.log(err);
           req.flash("error", err.message);
           res.redirect("/");
       } else{
           res.render("user/userd", {rates: today});
       }
    });
});

//Handle new transaction request
app.post("/userd", isLoggedIn, function(req, res) {
    req.body.transaction.transactionId = ++tranId;
    req.body.transaction.author = req.user;
        
    
   Transaction.create(req.body.transaction, function(err, newTransaction){
      if(err || !(newTransaction)){
          console.log(err);
          req.flash("error", err.message);
          res.redirect("/userd");
      }else{
          Rates.findOne({isUpdated: true}, function(err, today){
            if(err || !(today)){
               console.log(err);
               req.flash("error", err.message);
               res.redirect("/userd"); 
            }else{
                console.log("I am in \n");
                newTransaction.rate = today[newTransaction.name];
                newTransaction.payable = Number(newTransaction.amount) * Number(newTransaction.rate);
                newTransaction.save();
                req.user.transactions.push(newTransaction);
                req.user.save();
                req.flash("success", "Your order placed successfully....");
                var message ="Your order is placed with Transaction ID "+ newTransaction.transactionId + "is placed successfully. \n\n We will contact you via email or phone to complete the transaction.\n\nWith Regards,\nBuy/Sell Point\nEmail: admin@buysellpoint.in\nPhone:9562308197\nWebsite: www.buysellpoint.in\n\n\n\nP.S.: You cannot reply to this mail.\nInstead contact us at admin@buysellpoint.in"; 
            	var mailOptions = {
              	from: {name: 'Buy/Sell Point', address:"vm23526@gmail.com"},
              	to: newTransaction.author.email,
              	cc:['baby.manikantan@gmail.com'],
              	subject: 'Reg: Buy/Sell Order',
              	text: message,
            	};
            	transporter.sendMail(mailOptions, function(error, info){
            	  if (error) {
            	  	console.log(error);
            	  	req.flash("error","No Email has been sent to your email...");
            	  	res.redirect("/userd");
            	  }else{
            	      console.log("\nNo mail sending error.\n");
            	  }
            	}); 
                res.redirect("/userd");
            }
        });
          
      } 
   }); 
});

//Display pending transactions
app.get("/userd/transactions", isLoggedIn, function(req, res) {
    User.findById(req.user._id).populate("transactions").exec(function(err, foundUser){
       if(err || !(foundUser)){
           console.log(err);
           req.flash("error", err.message);
           res.redirect("/userd");
       } else{
           res.render("user/transactions",{user: foundUser});
       }
    });
});

//Display transaction history
app.get("/userd/history", isLoggedIn, function(req, res) {
    User.findById(req.user._id).populate("transactions").exec(function(err, foundUser){
       if(err || !(foundUser)){
           console.log(err);
           req.flash("error", err.message);
           res.redirect("/userd");
       } else{
           res.render("user/history",{user: foundUser});
       }
    });
});
//Admin Dashboard
//Display all pending transactions
app.get("/admind", isAdminIn, function(req, res){
   Transaction.find({isCompleted: false}, function(err, transactions){
       if(err || !(transactions)){
           console.log(err);
           req.flash("error", err.message);
           res.redirect("/");
       }else{
           res.render("admin/admind", {transactions: transactions});
       }
   }); 
});

//Handle transaction completing request
app.post("/:id/complete", isAdminIn, function(req, res){
   Transaction.findByIdAndUpdate(req.params.id, {status: "Transaction completed \r\nRef Number: " + req.body.remarks, isCompleted: true} ,function(err, transaction){
      if(err || !(transaction)){
          console.log(err);
          req.flash("error", err.message);
          res.redirect("back");
      } else{
              req.flash("success","Successfully updated....");
              var message ="Your order placed with Transaction ID "+ transaction.transactionId + "has been completed successfully\n\n"+ transaction.status +"\n\nWith Regards,\nBuy/Sell Point\nPhone:9562308197\nEmail: admin@buysellpoint.in\nWebsite: www.buysellpoint.in\n\n\n\nP.S.: You cannot reply to this mail.\nInstead contact us at admin@buysellpoint.in"; 
              var mailOptions = {
              	from: {name: 'Buy/Sell Point', address:"vm23526@gmail.com"},
              	to: transaction.author.email,
              	subject: 'Reg: Buy/Sell Order',
              	text: message,
            	};
            	transporter.sendMail(mailOptions, function(error, info){
            	  if (error) {
            	  	console.log(error);
            	  	req.flash("error","No Email has been sent...");
            	  	res.redirect("/admind");
            	  }else{
            	      console.log("\nNo mail sending error...\n");
            	      req.flash("success", "Email update sent to customer...")
            	  }
            	});
              res.redirect("/admind");
          
      }
   }); 
});

//Display previous transactions
app.get("/admind/history", isAdminIn, function(req, res) {
   Transaction.find({isCompleted: true}, function(err, transactions){
       if(err || !(transactions)){
           console.log(err);
           req.flash("error", err.message);
           res.redirect("/admind");
       }else{
           res.render("admin/history", {transactions: transactions});
       }
   }); 
});

//Display Form to update rates
app.get("/admind/rates", isAdminIn, function(req, res) {
   res.render("admin/newrates"); 
});

//Handle rate update request
app.post("/admind/rates", isAdminIn, function(req, res) {
   Rates.remove(function(err){
       if(err){
           console.log(err);
           req.flash("error", err.message);
           res.redirect("/admind/rates");
       }else{
           Rates.create(req.body.rates, function(err, newRates){
              if(err){
                 console.log(err);
                   req.flash("error", err.message);
                   res.redirect("/admind/rates"); 
              } else{
                  req.flash("success", "New rates successfully submitted....");
                  res.redirect("/admind");
              }
           });
       }
   }); 
});




//Middleware
//To check whether user is logged in
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        req.flash("success","Welcome "+req.user.firstName);
        return next();
    }else{
        req.flash("error","Please login to do that....");
        res.redirect("/login");
    }
}

//To check whether admin is logged in
function isAdminIn(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.isAdmin){
            return next();
        }else{
            req.flash("error", "You are not an admin....Access Denied");
            res.redirect("/");
        }
    }else{
        req.flash("error", "You have to login first....");
        res.redirect("/login");
    }
}

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("App Started!!");
   
});
    