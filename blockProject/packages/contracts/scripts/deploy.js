const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Pricing contract
  const Pricing = await hre.ethers.getContractFactory("Pricing");
  const pricing = await Pricing.deploy();
  await pricing.waitForDeployment();
  console.log("Pricing deployed to:", pricing.target);

  // Deploy SupplyChain contract with Pricing address
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy(pricing.target);
  await supplyChain.waitForDeployment();
  console.log("SupplyChain deployed to:", supplyChain.target);

  // Example role granting
  const GOVERNMENT_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("GOVERNMENT_ROLE"));
  await pricing.grantRole(GOVERNMENT_ROLE, deployer.address);

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
