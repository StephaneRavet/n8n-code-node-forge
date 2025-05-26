import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

// Pour __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Charger la data d'input
const inputPath = path.join(__dirname, 'node-input.jsonc');
const mainPath = path.join(__dirname, 'node-main.js');
const outputPath = path.join(__dirname, 'node-output.jsonc');

const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const mainCode = fs.readFileSync(mainPath, 'utf8');

// 2. Préparer le contexte d'exécution
const sandbox = {
  $input: {
    first: () => inputData[0],
    all: () => inputData,
  },
  module: {},
  exports: {},
  require,
  console,
};

// 3. Exécuter le code dans le contexte
const script = new vm.Script(mainCode + '\n;module.exports = (typeof return !== "undefined" ? return : undefined);');
const context = vm.createContext(sandbox);
let result;
try {
  result = script.runInContext(context);
  // Si le code utilise 'return', il faut capturer la valeur retournée
  if (typeof context.module.exports !== 'undefined') {
    result = context.module.exports;
  }
} catch (err) {
  result = { error: err.message };
}

// 4. Écrire le résultat dans le fichier d'output
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log('Résultat écrit dans', outputPath); 