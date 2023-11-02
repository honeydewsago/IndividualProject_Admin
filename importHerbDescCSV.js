const fs = require('fs');
const Papa = require('papaparse');
const admin = require('firebase-admin');
const iconv = require('iconv-lite');

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pinellia-66b18-default-rtdb.firebaseio.com"
});

const database = admin.database();

function importHerbsDescription() {
  const csvFilePath = 'herbs_desc.csv';

  const csvData = fs.readFileSync(csvFilePath, 'utf-8');

  let insertedRowCount = 0; // Initialize the row count

  Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data;
      rows.forEach((row) => {
        const { name, namePinyin, description } = row;

        if (name && name.trim() !== "") {
          // Push the data to a new auto-generated key under "herbs_desc" node
          const newPostRef = database.ref("herbs_desc").push({
            name,
            namePinyin,
            description,
          });

          insertedRowCount++; // Increment the row count

        } else {
          console.warn("Skipping row with empty 'name' field.");
          console.warn("Problematic Row:", row);
        }
      });

      console.log(`CSV file 'herbs_desc.csv' successfully processed. Inserted ${insertedRowCount} rows.`);
    },
    error: (error) => {
      console.error('Error while parsing the CSV file:', error);
    }
  });
}

importHerbsDescription();
