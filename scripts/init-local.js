#!/usr/bin/env node

/**
 * Script de inicialización para desarrollo local
 * 1. Despliega el contrato AppStore en localhost
 * 2. Actualiza automáticamente la dirección en todos los archivos necesarios
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Iniciando despliegue local...\n');

// Paso 1: Desplegar contrato con Hardhat Ignition
console.log('📝 Step 1: Desplegando contrato con Hardhat Ignition...');
try {
  execSync('npx hardhat ignition deploy ignition/modules/AppStore.ts --network localhost --reset', {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('✅ Contrato desplegado\n');
} catch (error) {
  console.error('❌ Error desplegando contrato:', error.message);
  process.exit(1);
}

// Paso 2: Leer dirección desplegada
console.log('📝 Step 2: Leyendo dirección del contrato...');
const deploymentPath = path.join(rootDir, 'ignition/deployments/chain-31337/deployed_addresses.json');

if (!fs.existsSync(deploymentPath)) {
  console.error('❌ No se encontró el archivo de deployment');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
const contractAddress = deployment['AppStoreModule#AppStore'];

if (!contractAddress) {
  console.error('❌ No se encontró la dirección del contrato en el deployment');
  process.exit(1);
}

console.log('✅ Dirección del contrato:', contractAddress);
console.log('');

// Paso 3: Actualizar public/ignition (para el frontend)
console.log('📝 Step 3: Actualizando dirección en frontend...');
const publicDeploymentDir = path.join(rootDir, 'public/ignition/deployments/chain-31337');
const publicDeploymentPath = path.join(publicDeploymentDir, 'deployed_addresses.json');

// Crear directorio si no existe
if (!fs.existsSync(publicDeploymentDir)) {
  fs.mkdirSync(publicDeploymentDir, { recursive: true });
}

// Escribir dirección
fs.writeFileSync(publicDeploymentPath, JSON.stringify({
  'AppStoreModule#AppStore': contractAddress
}, null, 2));

console.log('✅ Frontend actualizado:', publicDeploymentPath);
console.log('');

// Paso 4: Actualizar subgraph.yaml
console.log('📝 Step 4: Actualizando dirección en subgraph...');
const subgraphPath = path.join(rootDir, 'subgraph/subgraph.yaml');

if (fs.existsSync(subgraphPath)) {
  let subgraphContent = fs.readFileSync(subgraphPath, 'utf8');
  
  // Buscar y reemplazar la dirección del contrato
  const addressRegex = /address:\s*"0x[a-fA-F0-9]{40}"/;
  const match = subgraphContent.match(addressRegex);
  
  if (match) {
    const oldAddress = match[0].match(/0x[a-fA-F0-9]{40}/)[0];
    subgraphContent = subgraphContent.replace(
      addressRegex,
      `address: "${contractAddress}"`
    );
    
    fs.writeFileSync(subgraphPath, subgraphContent);
    console.log('✅ Subgraph actualizado:');
    console.log(`   Anterior: ${oldAddress}`);
    console.log(`   Nueva:    ${contractAddress}`);
  } else {
    console.log('⚠️  No se encontró dirección en subgraph.yaml');
  }
} else {
  console.log('⚠️  No se encontró subgraph/subgraph.yaml');
}

console.log('');

// Paso 5: Copiar ABI actualizado
console.log('📝 Step 5: Copiando ABI actualizado...');
const artifactPath = path.join(rootDir, 'artifacts/contracts/AppStore.sol/AppStore.json');
const subgraphAbiDir = path.join(rootDir, 'subgraph/abis');

if (fs.existsSync(artifactPath)) {
  if (!fs.existsSync(subgraphAbiDir)) {
    fs.mkdirSync(subgraphAbiDir, { recursive: true });
  }
  
  const subgraphAbiPath = path.join(subgraphAbiDir, 'AppStore.json');
  fs.copyFileSync(artifactPath, subgraphAbiPath);
  console.log('✅ ABI copiado a subgraph/abis/');
} else {
  console.log('⚠️  No se encontró el artifact del contrato');
}

console.log('');

// Resumen
console.log('='.repeat(60));
console.log('✨ INICIALIZACIÓN COMPLETADA EXITOSAMENTE ✨');
console.log('='.repeat(60));
console.log('');
console.log('📋 Resumen:');
console.log(`   Contrato:  ${contractAddress}`);
console.log(`   Red:       localhost (chain ID: 31337)`);
console.log('');
console.log('📂 Archivos actualizados:');
console.log('   ✅ ignition/deployments/chain-31337/deployed_addresses.json');
console.log('   ✅ public/ignition/deployments/chain-31337/deployed_addresses.json');
console.log('   ✅ subgraph/subgraph.yaml');
console.log('   ✅ subgraph/abis/AppStore.json');
console.log('');
console.log('🎯 Próximos pasos:');
console.log('   1. Frontend: npm run dev');
console.log('   2. Subgraph: cd subgraph && graph codegen && graph build');
console.log('');
