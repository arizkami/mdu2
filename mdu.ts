#!/usr/bin/env bun

import { parseArgs } from 'util';
import { spawn } from 'child_process';
import path from 'path';

interface Args {
  gui?: boolean;
  help?: boolean;
  [key: string]: any;
}

function showHelp() {
  console.log(`
Media Downloader CLI

Usage:
  bun mdu.ts [options] [command]

Options:
  --gui          Launch the Electron GUI application
  --help, -h     Show this help message

Commands (CLI mode):
  download <url> [options]    Download media from URL
  info <url>                  Show media information
  list-extractors             List available extractors

Examples:
  bun mdu.ts --gui                                    # Launch GUI
  bun mdu.ts download "https://youtube.com/watch?v=..." # Download via CLI
  bun mdu.ts info "https://youtube.com/watch?v=..."     # Show info via CLI
`);
}

async function launchElectron() {
  console.log('🚀 Launching Media Downloader GUI...');
  
  const electronPath = path.join(process.cwd(), 'node_modules', '.bin', 'electron');
  const mainPath = path.join(process.cwd(), 'src', 'gui', 'main', 'index.tsx');
  
  const electronProcess = spawn(electronPath, [mainPath], {
    stdio: 'inherit',
    shell: true
  });
  
  electronProcess.on('error', (error) => {
    console.error('❌ Failed to launch Electron:', error.message);
    console.log('\n💡 Make sure to install dependencies first:');
    console.log('   bun install');
    process.exit(1);
  });
  
  electronProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`\n⚠️  Electron process exited with code ${code}`);
    }
    process.exit(code || 0);
  });
}

async function launchCLI(args: string[]) {
  console.log('🖥️  Launching Media Downloader CLI...');
  
  const cliPath = path.join(process.cwd(), 'src', 'cli', 'index.ts');
  
  const cliProcess = spawn('bun', ['run', cliPath, ...args], {
    stdio: 'inherit',
    shell: true
  });
  
  cliProcess.on('error', (error) => {
    console.error('❌ Failed to launch CLI:', error.message);
    console.log('\n💡 Make sure to install dependencies first:');
    console.log('   bun install');
    process.exit(1);
  });
  
  cliProcess.on('close', (code) => {
    process.exit(code || 0);
  });
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    // Check for GUI flag first
    if (args.includes('--gui')) {
      await launchElectron();
      return;
    }
    
    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }
    
    // If no special flags, pass everything to CLI
    await launchCLI(args);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    showHelp();
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});