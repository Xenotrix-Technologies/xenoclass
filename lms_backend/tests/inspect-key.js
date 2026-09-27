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
        serviceAccount = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
}

if (!serviceAccount) {
    console.error("Firebase Admin SDK config not found in env variable or JSON file.");
    process.exit(1);
}

console.log("Private Key Start:", serviceAccount.private_key.substring(0, 50));
console.log("Private Key End:", serviceAccount.private_key.substring(serviceAccount.private_key.length - 50));
console.log("Contains actual newlines:", serviceAccount.private_key.includes('\n'));
console.log("Contains literal \\n:", serviceAccount.private_key.includes('\\n'));
