const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, './serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    const content = fs.readFileSync(serviceAccountPath, 'utf8');
    // Remove newlines and extra spaces to make it a single line
    const singleLine = JSON.stringify(JSON.parse(content));
    console.log("\n--- COPY THE LINE BELOW ---");
    console.log(singleLine);
    console.log("--- END ---\n");
} else {
    console.error("serviceAccountKey.json not found in the backend directory.");
}
