const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, './serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    const content = fs.readFileSync(serviceAccountPath, 'utf8');
    const base64Content = Buffer.from(content).toString('base64');
    console.log("\n--- COPY THE BASE64 STRING BELOW ---");
    console.log(base64Content);
    console.log("--- END ---\n");
} else {
    console.error("serviceAccountKey.json not found in the backend directory.");
}
