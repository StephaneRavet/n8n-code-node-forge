import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import stripJsonComments from 'strip-json-comments';
import { WorkflowDataProxy } from 'n8n-workflow/dist/WorkflowDataProxy.js';
import chalk from 'chalk';

function logInfo(msg) {
  console.info(chalk.green('✔️  ' + msg));
}
function logError(msg) {
  console.error(chalk.red('❌ ' + msg));
}

// For __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load input data
const inputPath = path.join(__dirname, '../n8n-node/node-input.jsonc');
const mainPath = path.join(__dirname, '../n8n-node/node-main.js');
const outputPath = path.join(__dirname, '../n8n-node/node-output.jsonc');

const inputRaw = fs.readFileSync(inputPath, 'utf8');
let inputData = JSON.parse(stripJsonComments(inputRaw));
// Support both { data: [...] } and [...] as input
if (inputData && typeof inputData === 'object' && !Array.isArray(inputData) && Array.isArray(inputData.data)) {
  inputData = inputData.data;
}
logInfo('n8n-node/node-input.jsonc loaded');
const mainCode = fs.readFileSync(mainPath, 'utf8');
logInfo('n8n-node/node-main.js loaded');

if (!Array.isArray(inputData) || inputData.length === 0 || !inputData[0]) {
  logError('Input data is empty or malformed. $input.first() is undefined. Voici inputData :');
  console.error(inputData);
  process.exit(1);
}

// 2. Prepare the sandbox with a local $input implementation
function wrapItem(item) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return new Proxy(item, {
      get(target, prop, receiver) {
        if (prop === 'json') {
          return target; // Ignore .json and return the item itself
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
  return item;
}

const $input = {
  all: () => inputData.map(wrapItem),
  first: () => wrapItem(inputData[0]),
  item: (index) => wrapItem(inputData[index]),
};

const sandbox = {
  $input,
  module: {},
  exports: {},
  console,
};
sandbox.global = sandbox;

// 3. Execute the code in the context as a function
const wrappedCode = `
function __userCode__() {
${mainCode}
}
module.exports = __userCode__();
`;

const script = new vm.Script(wrappedCode);
const contextVm = vm.createContext(sandbox);
let result;
try {
  script.runInContext(contextVm);
  result = contextVm.module.exports;
  logInfo('n8n-node/node-main.js executed');
} catch (err) {
  result = { error: err.message };
  logError('n8n-node/node-main.js execution failed');
  if (err && err.stack) {
    logError(err.stack);
  }
}

// 4. Write the result to the output file
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
logInfo('@node-output.jsonc updated. Look at it ! 👀'); 