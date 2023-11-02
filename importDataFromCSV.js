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

function importDataToFirebase() {
  const csvFilePath = 'herbs_data.csv';

  const csvData = fs.readFileSync(csvFilePath);
  const utf8String = iconv.decode(csvData, 'utf-8');

  let insertedRowCount = 0; // Initialize the row count

  Papa.parse(utf8String, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data;
      rows.forEach((row) => {
        // Assuming the CSV columns are the same as before
        const { name, nameScientific, nameCN, namePinyin, property, meridianTropism, flavour, toxicology, storage, characteristics, placeOfOrigin, medicinePart, method, effect, usage, dosage, prohibition, imageLink } = row;

        if (name && name.trim() !== "") {
          // Parse meridianTropism and flavor as arrays
          const meridianTropismArray = meridianTropism.split(',');
          const flavourArray = flavour.split(',');

          // Push the data to a new auto-generated key under "herbs_cn" node
          const newPostRef = database.ref("herbs").push({
            name,
            nameScientific,
            nameCN,
            namePinyin,
            property,
            meridianTropism: meridianTropismArray,
            flavour: flavourArray,
            toxicology,
            storage,
            characteristics,
            placeOfOrigin,
            medicinePart,
            method,
            effect,
            usage,
            dosage,
            prohibition,
            imageLink
          });

          // Retrieve the unique key generated for the new data
          const postId = newPostRef.key;

          // Save the ID as an attribute in the herb data
          database.ref("herbs").child(postId).update({ id: postId });

          insertedRowCount++; // Increment the row count

          console.log("Data written to the database with key: " + postId);
        } else {
          console.warn("Skipping row with empty 'name' field.");
          console.warn("Problematic Row:", row);
        }
      });

      console.log(`CSV file successfully processed. Inserted ${insertedRowCount} rows.`);
    },
    error: (error) => {
      console.error('Error while parsing the CSV file:', error);
    }
  });
}

importDataToFirebase();