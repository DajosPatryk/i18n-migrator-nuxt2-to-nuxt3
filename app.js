require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const TARGET_DIRECTORY = process.env.TARGET_DIRECTORY;
const OUTPUT_DIRECTORY = path.join(__dirname, 'output');
const ignoreList       = JSON.parse(fs.readFileSync('ignore.json', 'utf-8'));

// Recursively find all JSON files in the target directory, ignoring specified files and directories
function findJsonFiles(dir) {
    let files = [];

    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const relativePath = path.relative(TARGET_DIRECTORY, filePath);

        // Checks if ignored
        if (ignoreList.some(ignoreItem => relativePath.startsWith(ignoreItem))) return;

        if (fs.statSync(filePath).isDirectory()) files = files.concat(findJsonFiles(filePath));
        else if (file.endsWith('.json')) files.push(filePath);
    });

    return files;
}

function mergeJson(target, source) {
    return { ...target, ...source };
}

function transformFiles(files) {
    files.forEach(file => {
        const relativePath             = path.relative(TARGET_DIRECTORY, file);
        const [lang, ...filePathParts] = relativePath.split(path.sep);
        const newDirPath               = path.join(OUTPUT_DIRECTORY, ...filePathParts);

        const cleanedDirPath = newDirPath.replace(/\.json$/, '');
        const newPath        = path.join(cleanedDirPath, `${lang}.json`);
        fs.mkdirSync(path.dirname(newPath), { recursive: true });

        const sourceJson = JSON.parse(fs.readFileSync(file, 'utf-8'));
        let targetJson   = {};

        // If file exists, save to target JSON
        if (fs.existsSync(newPath)) {
            const existingContent = fs.readFileSync(newPath, 'utf-8');
            targetJson = JSON.parse(existingContent);
        }

        // Merge JSON and write to new path
        const mergedJson = mergeJson(targetJson, sourceJson);
        fs.writeFileSync(newPath, JSON.stringify(mergedJson, null, 2));
    });
}

// Run
const jsonFiles = findJsonFiles(TARGET_DIRECTORY);
transformFiles(jsonFiles);

console.log('📦 Translation files have been migrated!');
console.log('New structure is found under ./output.')
