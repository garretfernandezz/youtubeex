const express = require("express");
const path = require("path");
const hbs = require("hbs");
const multer = require("multer");
const session = require('express-session');
const { collection: User, Activity } = require('./mongodb'); // Correct models imported
const handlebars = require('handlebars'); 

const app = express();

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

// Set up session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session valid for 1 day
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up template engine and static files
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, '../templates'));
app.use(express.static('public'));

// File Upload Middleware (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Authentication Middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Login Route
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Simple hardcoded login logic (replace with actual database query)
    if (email === "gargimittal@gmail.com" && password === "gargi10@") {
        req.session.user = { name: "Gargi Mittal", email: "gargimittal@gmail.com" };
        res.redirect("/");
    } else {
        res.send("Invalid username or password");
    }
});

// Volunteer Dashboard
app.get("/", isAuthenticated, (req, res) => {
    const username = req.session.user.name;
    res.render("volunteerDash", { username });
});

// My Activities Route
app.get("/my-activities", isAuthenticated, async (req, res) => {
    try {
        // Fetch activities associated with the logged-in user
        const activities = await Activity.find({ user: req.session.user.email });
        res.render("vol-management", { activities });
    } catch (err) {
        res.status(500).send("Error fetching activities: " + err.message);
    }
});

// Add Activity Route
// Add Activity Route (Post new activity)
app.post("/add-activity", isAuthenticated, upload.single('media'), async (req, res) => {
    try {
        console.log("Form Data Received:", req.body); // Log form data to check if it's being received
        console.log("File Received:", req.file); // Log file upload information

        console.log("User session:", req.session.user);  // Check if session data is available

        
        // Create a new activity document
        const newActivity = new Activity({
            user: req.session.user.email,  // Store user email from session
            description: req.body.description,
            media: req.file ? req.file.path : null,  // Handle media upload if present
            hours: req.body.hours
        });

        // Save the activity to MongoDB
        await newActivity.save();

        console.log("Activity Saved:", newActivity); // Log the saved activity

        // Redirect back to activities page
        res.redirect("/my-activities");
    } catch (err) {
        console.error("Error adding activity:", err.message);
        res.status(500).send("Error adding activity: " + err.message);
    }
});

// Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));
