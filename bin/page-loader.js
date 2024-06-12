#! /usr/bin/env node

import { Command } from 'commander';
import { pageLoader } from '../src/pageLoader.js';

const program = new Command();

program
  .name('page-loader')
  .description('Downloads web pages to the chosen directory, so to access them without the internet connection')
  .version('1.0.0')
  .argument('URL')
  .option('-o, --output [dir]', 'output dir (default: current working dir)')
  .action(async (URL, option) => {
    const { filepath } = await pageLoader(URL, option.output);
    console.log(`Page was successfully downloaded into ${filepath}`);
  });

program.parse();
