const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env variable:", e.message);
    }
}

if (!serviceAccount) {
    const configPath = path.join(__dirname, "../config/xenoclass-app-firebase-adminsdk-dzxda-ca2f1a6c2b.json");
    if (fs.existsSync(configPath)) {
        serviceAccount = require(configPath);
    }
}

if (!serviceAccount) {
    console.error("Firebase Admin SDK config not found in env variable or JSON file.");
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase initialized.");

    // Attempt to get an access token to verify the signature
    admin.credential.cert(serviceAccount).getAccessToken()
        .then(token => {
            console.log("Successfully fetched access token!");
            process.exit(0);
        })
        .catch(err => {
            console.error("Failed to fetch access token:", err);
            process.exit(1);
        });
} catch (e) {
    console.error("Initialization failed:", e);
    process.exit(1);
}
