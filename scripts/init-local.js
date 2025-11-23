#!/usr/bin/env node

/**
 * Initialization script for local development
 * 1. Deploys the AppStore contract to localhost
 * 2. Automatically updates the address in all necessary files
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Starting local deployment...\n');

// Step 1: Deploy contract with Hardhat Ignition
console.log('📝 Step 1: Deploying contract with Hardhat Ignition...');
try {
  execSync('npx hardhat ignition deploy ignition/modules/AppStore.ts --network localhost --reset', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✅ Contract deployed\n');
} catch (error) {
  console.error('❌ Error deploying contract:', error.message);
  process.exit(1);
}

// Step 2: Read deployed address
console.log('📝 Step 2: Reading contract address...');
const deploymentPath = path.join(rootDir, 'ignition/deployments/chain-31337/deployed_addresses.json');

if (!fs.existsSync(deploymentPath)) {
  console.error('❌ Deployment file not found');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
const contractAddress = deployment['AppStoreModule#AppStore'];

if (!contractAddress) {
  console.error('❌ Contract address not found in deployment');
  process.exit(1);
}

console.log('✅ Contract address:', contractAddress);
console.log('');

// Step 3: Update public/ignition (for the frontend)
console.log('📝 Step 3: Updating address in frontend...');
const publicDeploymentDir = path.join(rootDir, 'public/ignition/deployments/chain-31337');
const publicDeploymentPath = path.join(publicDeploymentDir, 'deployed_addresses.json');

// Create directory if it doesn't exist
if (!fs.existsSync(publicDeploymentDir)) {
  fs.mkdirSync(publicDeploymentDir, { recursive: true });
}

// Write address
fs.writeFileSync(publicDeploymentPath, JSON.stringify({
  'AppStoreModule#AppStore': contractAddress
}, null, 2));

console.log('✅ Frontend updated:', publicDeploymentPath);
console.log('');

// Step 4: Update subgraph.yaml
console.log('📝 Step 4: Updating address in subgraph...');
const subgraphPath = path.join(rootDir, 'subgraph/subgraph.yaml');

if (fs.existsSync(subgraphPath)) {
  let subgraphContent = fs.readFileSync(subgraphPath, 'utf8');
  
  // Find and replace the contract address
  const addressRegex = /address:\s*"0x[a-fA-F0-9]{40}"/;
  const match = subgraphContent.match(addressRegex);
  
  if (match) {
    const oldAddress = match[0].match(/0x[a-fA-F0-9]{40}/)[0];
    subgraphContent = subgraphContent.replace(
      addressRegex,
      `address: "${contractAddress}"`
    );
    
    fs.writeFileSync(subgraphPath, subgraphContent);
    console.log('✅ Subgraph updated:');
    console.log(`   Previous: ${oldAddress}`);
    console.log(`   New:      ${contractAddress}`);
  } else {
    console.log('⚠️  Address not found in subgraph.yaml');
  }
} else {
  console.log('⚠️  subgraph/subgraph.yaml not found');
}

console.log('');

// Step 5: Copy updated ABI
console.log('📝 Step 5: Copying updated ABI...');
const artifactPath = path.join(rootDir, 'artifacts/contracts/AppStore.sol/AppStore.json');
const subgraphAbiDir = path.join(rootDir, 'subgraph/abis');

if (fs.existsSync(artifactPath)) {
  if (!fs.existsSync(subgraphAbiDir)) {
    fs.mkdirSync(subgraphAbiDir, { recursive: true });
  }
  
  const subgraphAbiPath = path.join(subgraphAbiDir, 'AppStore.json');
  fs.copyFileSync(artifactPath, subgraphAbiPath);
  console.log('✅ ABI copied to subgraph/abis/');
} else {
  console.log('⚠️  Contract artifact not found');
}

console.log('');

// Summary
console.log('='.repeat(60));
console.log('✨ INITIALIZATION COMPLETED SUCCESSFULLY ✨');
console.log('='.repeat(60));
console.log('');
console.log('📋 Summary:');
console.log(`   Contract:  ${contractAddress}`);
console.log(`   Network:   localhost (chain ID: 31337)`);
console.log('');
console.log('📂 Updated files:');
console.log('   ✅ ignition/deployments/chain-31337/deployed_addresses.json');
console.log('   ✅ public/ignition/deployments/chain-31337/deployed_addresses.json');
console.log('   ✅ subgraph/subgraph.yaml');
console.log('   ✅ subgraph/abis/AppStore.json');
console.log('');
console.log('🎯 Next steps:');
console.log('   1. Frontend: npm run dev');
console.log('   2. Subgraph: cd subgraph && graph codegen && graph build');
console.log('');
