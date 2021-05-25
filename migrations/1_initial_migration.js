const Migrations = artifacts.require("Migrations");
const contractRegistry = artifacts.require("ContractRegistry");
const policyManagement = artifacts.require("PolicyManagement");
const liquidityManagement = artifacts.require("LiquidityManagement");
const investmentManagement = artifacts.require("InvestmentManagement");
const claimsManagement = artifacts.require("ClaimsManagement");
const daiContract = artifacts.require("Dai");


module.exports = async function(deployer, network, accounts) {
  
  // deployments
  
  await deployer.deploy(Migrations);
  await deployer.deploy(contractRegistry);
  await deployer.deploy(policyManagement);
  await deployer.deploy(liquidityManagement,  {gasPrice: 1000000000});
  await deployer.deploy(investmentManagement);
  await deployer.deploy(claimsManagement);

  // instantiations

  const ContractRegistry = await contractRegistry.deployed();
  const PolicyManagement = await policyManagement.deployed();
  const LiquidityManagement = await liquidityManagement.deployed();
  const InvestmentManagement = await investmentManagement.deployed();
  const ClaimsManagement = await claimsManagement.deployed();
  const dai = await daiContract.at("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"); 
  const link = await daiContract.at(
    "0xb0897686c545045afc77cf20ec7a532e3120e0f1" // mainnet address
    // "0x326C977E6efc84E512bB9C30f76E30c160eD06FB" // testnet address
  ); 

  // initial setup
  
  await Promise.all([
    ContractRegistry.setKYCprovider(accounts[0]),
    ContractRegistry.setPaymentTokenContract(
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063" // Matic Mainnet address for DAI
    ),
    ContractRegistry.setPolicyManagementContract(PolicyManagement.address),
    ContractRegistry.setLiquidityManagementContract(
      LiquidityManagement.address
    ),
    ContractRegistry.setInvestmentManagementContract(
      InvestmentManagement.address
    ),
    ContractRegistry.setClaimsManagementContract(
      ClaimsManagement.address
    ),
    ContractRegistry.setCurveAddresses(
      // Matic mainnet addresses
      ["0x445FE580eF8d70FF569aB36e80c647af338db351",
      "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171"]
    ),
    ContractRegistry.setAaveAddresses(
      // Matic mainnet addresses
      ["0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf",
      "0x27F8D03b3a2196956ED754baDc28D73be8830A6e"]
    ),
  ]);
  
  console.log("Contract Registry information entered");

  await Promise.all([
    PolicyManagement.setContractRegistryAndAddresses(ContractRegistry.address),
    LiquidityManagement.setContractRegistryAndAddresses(
      ContractRegistry.address
    ),
    InvestmentManagement.setContractRegistryAndAddresses(
      ContractRegistry.address
    ),
    ClaimsManagement.setContractRegistryAndAddresses(
      ContractRegistry.address
    ),
  ]);

  console.log("Contract Registry address set in contracts");
  */
  const ClaimsManagement = await claimsManagement.at("0xd4B6d45dD6D28a83E158244ECFaCa776812D8216");
  const LiquidityManagement = await liquidityManagement.at("0xf635711CB67FA833032e0e4D210E35cd52bA4Ce2");
  const dai = await daiContract.at("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"); 
  const link = await daiContract.at(
    "0xb0897686c545045afc77cf20ec7a532e3120e0f1" // mainnet address
    // "0x326C977E6efc84E512bB9C30f76E30c160eD06FB" // testnet address
  ); 


  // set Oracle parameters and send LINK budget to the Claims Management contract
  
  await ClaimsManagement.setOracleParameters(1);

  console.log("Oracle parameters set to Matrixed.link provider");
  
  const LINKbalance = await link.balanceOf(accounts[0]);
  
  await link.transfer(
    ClaimsManagement.address,
    LINKbalance,
    {
      from: accounts[0],
    }
  );

  console.log("LINK balance transfered");
  
  // open LiqMgt for contributions, send starting capital in DAI, close contributions and activate
  
  await LiquidityManagement.openContractForContributions({
    from: accounts[0],
  });
  console.log("Liquidity contract open for contributions");
  await dai.approve(LiquidityManagement.address, web3.utils.toWei("10"), {
    from: accounts[0],
  });
  console.log("Approval for DAI payment completed");
  await LiquidityManagement.addInitialLiquidityViaInitialContribution(
    web3.utils.toWei("10"),
    { from: accounts[0] }
  );
  console.log("Initial liquidity added");
  await LiquidityManagement.closeContributionsAndActivate({
    from: accounts[0],
  });
  console.log("Liquidity contract activated");

  /* TESTING INVESTMENT MANAGEMENT CONTRACT

  // transfering 1 DAI to the Investment Management contract then calling internal function to deposits funds in Aave + Curve

  let daiBalance0 = await dai.balanceOf(accounts[0]);
  daiBalance0 = parseInt(web3.utils.fromWei(daiBalance0));

  console.log(`Initial Account 0 DAI balance : ${daiBalance0}`);

  await dai.approve(
    InvestmentManagement.address,
    web3.utils.toWei("2"),
    {
      from: accounts[0],
    }
  );
  await dai.transfer(
    InvestmentManagement.address,
    web3.utils.toWei("2"),
    {
      from: accounts[0],
    }
  );

  await InvestmentManagement._addFundsForInvestment(
    web3.utils.toWei("2"),
    {
      from: accounts[0],
    }
  );

  console.log("Funds deposited");

  let idaiBalance0 = await dai.balanceOf(accounts[0]);
  idaiBalance0 = parseInt(web3.utils.fromWei(idaiBalance0));

  console.log(`Intermediate Account 0 DAI balance : ${idaiBalance0}`);

  // checking correctness of the data returned by the getInvestedFunds function
  
  const funds = await InvestmentManagement.getInvestedFunds();
  console.log(funds.toString());

  console.log(`Funds invested in Aave and Curve : ${web3.utils.fromWei(funds)}`);

  // withdrawing funds and checking that they have been correctly sent to the Liquidity Management contract

  await InvestmentManagement._withdrawInvestedFunds(
    web3.utils.toWei("10"), true
  );

  console.log("Funds withdrawn");

  let fdaiBalance0 = await dai.balanceOf(LiquidityManagement.address);
  fdaiBalance0 = web3.utils.fromWei(fdaiBalance0);

  console.log(`Final Liquidity Management balance : ${fdaiBalance0}`);

  */

  /* ORACLE TEST
  // transfering 0.01 LINK to the Claims Management contract
  
  const LINKbalance = await link.balanceOf(accounts[0]);
  console.log(web3.utils.fromWei(LINKbalance));

  
  await link.transfer(
    ClaimsManagement.address,
    web3.utils.toWei("0.01"),
    {
      from: accounts[0],
    }
  );

  console.log("LINK transfered");
  
  
  await ClaimsManagement.getOracleConfirmation(web3.utils.asciiToHex("20160528"), "34OD47957", {
    from: accounts[0],
  });

  console.log("Oracle call started");

  setTimeout(function(){ console.log("Timeout finished"); }, 10000);
  

  
  let oracleResult = await ClaimsManagement.lastOracleResult({
    from: accounts[0],
  });

  console.log(oracleResult);
  */

};
