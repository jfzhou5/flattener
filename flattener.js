#!/usr/bin/env node

const commander = require("commander");
const path = require("path");
const shell = require("shelljs");
const fs = require("fs");
const readline = require("readline");
const cwd = process.cwd();

const program = new commander.Command();
const defaultFlatPath = path.join(cwd, "flatten/");
const licenseStr = "SPDX-License-Identifier: ";
const abiEncoderV2 = "pragma abicoder";

async function processLineByLine(filePath) {
  const fileStream = fs.createReadStream(filePath);
  let LicenseExist = false;
  let abiEncoderV2Exist = false;
  let wl = new Array();

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, // 注意：我们使用 crlfDelay 选项将 input.txt 中的所有 CR LF 实例（'\r\n'）识别为单个换行符。
  });

  // remove multiple license str
  for await (const line of rl) {
    if (line.indexOf(licenseStr) >= 0) {
      if (!LicenseExist) {
        LicenseExist = true;
        wl.push(line + "\n");
      }
    } else if (line.includes(abiEncoderV2)) {
      if (!abiEncoderV2Exist) {
        abiEncoderV2Exist = true;
        wl.push(line + "\n");
      }
    } else {
      wl.push(line + "\n");
    }
  }

  // rewrite flat sol file
  const fwrite = fs.createWriteStream(filePath);
  for await (const line of wl) {
    fwrite.write(line);
  }
}

program.arguments("<filePath> [outputPath]").action((filePath, outputPath) => {
  filePath = path.join(cwd, filePath);
  let fileName = filePath.split("/").slice(-1)[0];

  if (!outputPath) {
    outputPath = path.join(defaultFlatPath, fileName);
  } else {
    outputPath = path.join(defaultFlatPath, outputPath);
  }

  shell.exec(`npx hardhat flatten ${filePath} > ${outputPath}`);

  processLineByLine(outputPath);

  console.log("output path: ", outputPath);
});

program.parse(process.argv);

// if (require.main === module) {
//   console.log(process.argv.slice(2))
// }
