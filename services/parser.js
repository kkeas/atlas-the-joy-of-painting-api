const { parse } = require("graphql");
const csv = require('csv-parse');
const fs = require('fs');


const colors = [];
const subjects = [];
const dates = [];
const outputFile = '../data/transformedData.json';
let paintingList

// parse data from txt file - only the month
fs.readFile('../data/episodeDates.txt', 'utf8', (err, txtData) => {
    if (err) {
        console.log(`Error reading txt file:`, err);
    return;
}

var dates = parseDatesFromTxt(txtData);
console.log(`Parsed txt file: `, dates)
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

// colors used - take actual names from 9th column syntax: "['x', 'y', 'z']"

let rowIndexColors = 0;

fs.createReadStream('../data/colorsUsed.csv')
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
    })
    .on('end', () => {
        console.log('Transformed colors:', colors);
      });

    //grab subject matter based on corresponding 

    let rowIndexSubjects = 0;

    fs.createReadStream('../data/subjectMatter.csv')
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
            console.log('Transformed subjects:', subjects);
          });

        // merging json arrays
        const mergedData = subjects.map((subject, rowIndex) => {
            return Object.assign({}, subject, colors[rowIndex]);
        });

        function transformSubjects(row, rowIndex) {
            const headersData = row.slice(2); // Exclude the first two columns (EPISODE and TITLE)

            const result = [];
                for (let i = 0; i < headersData.length; i++) {
                    if (headersData[i] === '1') {
                        result.push(headers[i + 2]); // Get the corresponding header name
                    }
                }

                return {
                    id: rowIndex,
                    matchedColumns: result
                };
        }

        function transformColors(colors, rowIndex) {
            const colorsColumn = colors[8]; // Access the 9th column (index 8)
            const parsedColorsColumn = JSON.parse(colorsColumn.replace(/'/g, '"'));
            
            return {
                id: rowIndex,
                colors: parsedColorsColumn,
            };
        };

         // write to JSON file
        fs.writeFile(outputFile, JSON.stringify(mergedData, null, 4), (err) => {
            if (err) {
                console.error('Error writing JSON file:', err);
            } else {
                console.log('JSON file has been saved:', outputFile);
            }
        });
