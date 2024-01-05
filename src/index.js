const express = require('express');
const bodyParser = require('body-parser');
const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/runcode', async (req, res) => {
    const code = req.body.code;
    const language = req.body.language;

    try {
        // Save the code to a temporary file asynchronously
        const filePath = 'temp';
        const fileExtension = getFileExtension(language);
        const fileName = `${filePath}.${fileExtension}`;
        await fs.writeFile(fileName, code);

        // Execute the code based on the specified language with a timeout of 10 seconds
        const command = getExecutionCommand(language, fileName);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timeout')), 10000));
        const executionPromise = promisify(exec)(command);

        const { stdout, stderr } = await Promise.race([executionPromise, timeoutPromise]);

        console.log(stdout);

        // Clean up the temporary file asynchronously
        await fs.unlink(fileName);

        if (stderr) {
            res.status(500).json({ result: stderr.trim() });
        } else {
            res.json({ result: stdout.trim() });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: error.message });
    }
});

function getFileExtension(language) {
    switch (language) {
        case 'python':
            return 'py';
        case 'java':
            return 'java';
        case 'c':
            return 'c';
        case 'ocaml':
            return 'ml';
        default:
            throw new Error('Unsupported language');
    }
}

function getExecutionCommand(language, fileName) {
    switch (language) {
        case 'python':
            return `python3 ${fileName}`;
        case 'java':
            return `javac ${fileName} && java ${fileName.substring(0, fileName.lastIndexOf('.'))}`;
        case 'c':
            return `gcc ${fileName} -o demo && ./exe_c ./demo`;
        case 'ocaml':
            return `ocamlc -o ${fileName.substring(0, fileName.lastIndexOf('.'))} ${fileName} && ./${fileName.substring(0, fileName.lastIndexOf('.'))}`;
        default:
            throw new Error('Unsupported language');
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
