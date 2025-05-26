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
const inputData = JSON.parse(stripJsonComments(inputRaw));
logInfo('n8n-node/node-input.jsonc loaded');
const mainCode = fs.readFileSync(mainPath, 'utf8');
logInfo('n8n-node/node-main.js loaded');

// 2. Minimal mock for workflow and execution context
const workflow = {
  getNode: () => ({}),
  getNodeConnectionIndexes: () => ({ sourceIndex: 0 }),
  settings: {},
  nodes: {},
};
const runExecutionData = {
  resultData: {
    runData: {},
  },
};
const runIndex = 0;
const itemIndex = 0;
const activeNodeName = 'Code1'; // adapt if needed
const connectionInputData = inputData;
const siblingParameters = {};
const mode = 'manual';
const additionalKeys = {};
const executeData = {};
const defaultReturnRunIndex = -1;

const dataProxy = new WorkflowDataProxy(
  workflow,
  runExecutionData,
  runIndex,
  itemIndex,
  activeNodeName,
  connectionInputData,
  siblingParameters,
  mode,
  additionalKeys,
  executeData,
  defaultReturnRunIndex
);
const context = dataProxy.getDataProxy();

// 3. Prepare the sandbox with the real $input
const sandbox = {
  $input: context.$input,
  module: {},
  exports: {},
  console,
};
sandbox.global = sandbox;

// 4. Execute the code in the context as a function
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

// 5. Write the result to the output file
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
logInfo('@node-output.jsonc updated. Look at it ! 👀'); 