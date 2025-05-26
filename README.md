# n8n-code-node-forge

This project simulates the local execution of the n8n Code node, allowing you to inject input data, inspect output results, and debug your code in VS Code with live-reload.

## Features
- Local execution of code as in the n8n Code node
- Injection of custom input data
- Inspection of output results
- Easy debugging in VS Code
- Live-reload support

## Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd n8n-code-node-forge
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```

## Usage

> ⚠️ Detailed usage documentation is yet to be completed according to the scripts and files provided in the project.

## Recommended VS Code Extensions

This project recommends installing the following extension for a better development experience:

- [n8n-utils (ivov.n8n-utils)](https://marketplace.visualstudio.com/items?itemName=ivov.n8n-utils)

VS Code will automatically prompt you to install it when opening the project.

## Security & Vulnerabilities

Some vulnerabilities may persist in the `n8n` dependencies. They cannot be fixed without breaking compatibility with recent versions of `n8n`.

- **Recommended usage:** local development only, do not expose in production.
- **Monitor updates** of `n8n` to benefit from security fixes as soon as they become available.

## Author
Stéphane Ravet

## License
MIT 