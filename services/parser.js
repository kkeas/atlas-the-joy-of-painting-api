const { parse } = require("graphql");
const csv = require('csv-parse');
const fs = require('fs');


const colors = [];
const subjects = [];
const monthsList = [];
const outputFile = '../data/transformedData.json';
let rowIndex = 0


// colors used - take actual names from 9th column syntax: "['x', 'y', 'z']"

let rowIndexColors = 0;

colorsReadStream = fs.createReadStream('../data/colorsUsed.csv')
const colorsPromise = new Promise((resolve, reject) => {
colorsReadStream
    .pipe(csv.parse({
    delimiter: ',',
    newline: '\n',
    trim: true,
    relaxColumnCount: true
    }))
    .on('data', (colorsUsed) => {
    // Process the data
    if (rowIndexColors === 0) {
        // Skip the header row
        rowIndexColors++;
        return;
    }
        const readableColors = transformColors(colorsUsed, rowIndexColors);
        colors.push(readableColors);
        rowIndexColors++;
        // close file
        colorsArray = colors;
    })

    .on('end', () => {
        // console.log('Transformed colors:', colors);
        colorsReadStream.destroy();
        // if (colors.length > 0 && subjects.length > 0 && monthsList.length > 0) {
            // writeToJSONFile();
        // }
        resolve();
      });
    });
// grab subject matter based on corresponding 

let rowIndexSubjects = 0;

subjectsReadStream = fs.createReadStream('../data/subjectMatter.csv')
const subjectsPromise = new Promise((resolve, reject) => {
subjectsReadStream
    .pipe(csv.parse({
        delimiter: ',',
            newline: '\n',
            trim: true,
            relaxColumnCount: true
        }))
        .on('data', (subjectMatter) => {
        // process data
        if (rowIndexSubjects === 0) {
            // Skip the header row
            headers = subjectMatter;
            rowIndexSubjects++;
            return;
        }
        const readableSubjects = transformSubjects(subjectMatter, rowIndexSubjects);
        subjects.push(readableSubjects);
        rowIndexSubjects++;
        })
        .on('end', () => {
            // console.log('Transformed subjects:', subjects);
            subjectsReadStream.destroy();
            // if (colors.length > 0 && subjects.length > 0 && monthsList.length > 0) {
               // writeToJSONFile();
            // }
            resolve();
          });
});

function parseDatesFromTxt(txtData) {
    const lines = txtData.split('\n');
    const months = lines.map((line) => {
    const match = line.match(/"(.+)"\s+\((.+)\)/);
        if (match) {
            const dateString = match[2];
            const date = new Date(dateString);
            const monthName = date.toLocaleString('default', { month: 'long' });
            return monthName;
        }
        return null;
        }).filter(Boolean);
    return months;
}
        

        


// parse data from txt file - only the month
const monthsPromise = new Promise((resolve, reject) => {
    fs.readFile('../data/episodeDates.txt', 'utf8', (err, txtData) => {
      if (err) {
        console.log(`Error reading txt file:`, err);
        reject(err);
        return;
      }
  
      var dates = parseDatesFromTxt(txtData);
      console.log(`Parsed txt file:`, dates);
  
      const transformedMonths = transformMonths(dates, rowIndex);
      monthsList.push(transformedMonths); // Keep the original array structure
      console.log(`Transformed months:`, monthsList);
  
      resolve();
    });
  });

// Wait for all promises to resolve before writing to JSON file
Promise.all([colorsPromise, subjectsPromise, monthsPromise])
  .then(() => {
    writeToJSONFile();
  })
  .catch((error) => {
    console.error('Error processing data:', error);
  });



  function transformColors(colors, index) {
    const colorsColumn = colors[8]; // Access the 9th column (index 8)
    const parsedColorsColumn = JSON.parse(colorsColumn.replace(/'/g, '"'));
    rowIndex = index;
    
    return {
        id: index,
        // title: titlesColumn,
        colors: parsedColorsColumn,
    };
};

function transformMonths(dates, index) {
    rowIndex = index;
    return dates.map((month, index) => ({
        id: index,
        month: month
      }));
  };

function transformSubjects(row, index) {
    const headersData = row.slice(2); // Exclude the first two columns (EPISODE and TITLE)
    rowIndex = index
    const result = [];
        for (let i = 0; i < headersData.length; i++) {
            if (headersData[i] === '1') {
                result.push(headers[i + 2]); // Get the corresponding header name
            }
        }

        return {
            id: index,
            matchedColumns: result
        };
};

function writeToJSONFile() {
    if (colors.length === subjects.length && subjects.length === monthsList[0].length) {
        const mergedData = subjects.map((subject, rowIndex) => {
            return {
                [rowIndex]: {
                    // title: colors[rowIndex].titlesColumn,
                    subject: subject.matchedColumns,
                    color: colors[rowIndex].colors,
                    month: monthsList[0][rowIndex].month
                  }
                };
              });
          
              fs.writeFile(outputFile, JSON.stringify(mergedData, null, 2), (err) => {
                if (err) {
                  console.error('Error writing JSON file:', err);
                } else {
                  console.log('JSON file has been saved:', outputFile);
                }
              });
            }
          };
