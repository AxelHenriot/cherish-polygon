const contractRegistry = artifacts.require("ContractRegistry");
const policyManagement = artifacts.require("PolicyManagement");
const liquidityManagement = artifacts.require("LiquidityManagement");
const investmentManagement = artifacts.require("InvestmentManagement");
const claimsManagement = artifacts.require("ClaimsManagement");
const uniswapRouter = artifacts.require("IUniswapV2Router02");
const daiContract = artifacts.require("Dai");
const compoundPaymentToken = artifacts.require("CompoundPaymentToken");
const aaveLendingPool = artifacts.require("AaveLendingPool");

contract("PolicyManagement", (accounts) => {
  it("should allow for contributions and withdrawals", async () => {
    const ContractRegistry = await contractRegistry.deployed();
    const PolicyManagement = await policyManagement.deployed();
    const LiquidityManagement = await liquidityManagement.deployed();
    const InvestmentManagement = await investmentManagement.deployed();
    const ClaimsManagement = await claimsManagement.deployed();

    // initial setup
    
    await Promise.all([
      ContractRegistry.setKYCprovider(accounts[0]),
      ContractRegistry.setPaymentTokenContract(
        "0x6b175474e89094c44da98b954eedeac495271d0f"
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
      ContractRegistry.setCompoundPaymentTokenContract(
        "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
      ),
      ContractRegistry.setAaveAddresses([
        "0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3",
        "0x398eC7346DcD622eDc5ae82352F02bE94C62d119",
        "0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d",
      ]),
    ]);

    console.log("Contract Registry information entered");

    await Promise.all([
      PolicyManagement.setContractRegistryAndAddresses(
        ContractRegistry.address
      ),
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

    // Getting DAI from Uniswap for policyholder and second Aave/Compound User

    const uniswap = await uniswapRouter.at(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    await uniswap.swapExactETHForTokensSupportingFeeOnTransferTokens(
      100,
      [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
      ],
      accounts[1],
      1702133543,
      { from: accounts[1], value: web3.utils.toWei("10") }
    );

    await uniswap.swapExactETHForTokensSupportingFeeOnTransferTokens(
      100,
      [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
      ],
      accounts[4],
      1702133543,
      { from: accounts[4], value: web3.utils.toWei("10") }
    );

    const dai = await daiContract.at(
      "0x6b175474e89094c44da98b954eedeac495271d0f"
    );

    let daiBalance1 = await dai.balanceOf(accounts[1]);

    console.log(
      `Account 1 DAI balance : ${parseInt(web3.utils.fromWei(daiBalance1))}`
    );

    let daiBalance4 = await dai.balanceOf(accounts[4]);

    console.log(
      `Account 4 DAI balance : ${parseInt(web3.utils.fromWei(daiBalance4))}`
    );

    // activating Liquidity Management and sending contributions

    await LiquidityManagement.openContractForContributions({
      from: accounts[0],
    });
    await dai.approve(LiquidityManagement.address, daiBalance4, {
      from: accounts[4],
    });
    await LiquidityManagement.addInitialLiquidityViaInitialContribution(
      daiBalance4,
      { from: accounts[4] }
    );
    await dai.approve(LiquidityManagement.address, web3.utils.toWei("1000"), {
      from: accounts[1],
    });
    await LiquidityManagement.addInitialLiquidityViaInitialContribution(
      web3.utils.toWei("1000"),
      { from: accounts[1] }
    );
    await LiquidityManagement.closeContributionsAndActivate({
      from: accounts[0],
    });

    let totalLiabilities = await LiquidityManagement.totalLiabilities();
    console.log(`totalLiabilities: ${web3.utils.fromWei(totalLiabilities)}`);
    let minimumCapitalReserve = await LiquidityManagement.minimumCapitalReserve();
    console.log(
      `minimumCapitalReserve: ${web3.utils.fromWei(minimumCapitalReserve)}`
    );
    let lowerLiquidityLimit = await LiquidityManagement.lowerLiquidityLimit();
    console.log(
      `lowerLiquidityLimit: ${web3.utils.fromWei(lowerLiquidityLimit)}`
    );
    let higherLiquidityLimit = await LiquidityManagement.higherLiquidityLimit();
    console.log(
      `higherLiquidityLimit: ${web3.utils.fromWei(higherLiquidityLimit)}`
    );
    let currentLiquidityReserves = await LiquidityManagement.currentLiquidityReserves();
    console.log(
      `currentLiquidityReserves: ${web3.utils.fromWei(
        currentLiquidityReserves
      )}`
    );

    // quoting policy

    const payout = web3.utils.toWei("5000");

    console.log(payout);

    await PolicyManagement.confirmQuote("testQuote", 33, true, "Yearly", payout, {
      from: accounts[1],
    });

    console.log("Quote registered");

    // confirming KYC

    const policyHash = await PolicyManagement.policiesArray(0, {
      from: accounts[0],
    });

    console.log(policyHash);

    await PolicyManagement.confirmKYC(policyHash, "okidoki", {
      from: accounts[0],
    });

    console.log("KYC confirmed");

    // setting policy beneficiaries

    await PolicyManagement.setBeneficiaries(
      policyHash,
      [accounts[2], accounts[3]],
      [60, 40],
      { from: accounts[1] }
    );

    console.log("Beneficiaries set");

    // confirmation by the beneficiaries

    await PolicyManagement.confirmBeneficiary(policyHash, {
      from: accounts[2],
    });
    await PolicyManagement.confirmBeneficiary(policyHash, {
      from: accounts[3],
    });

    console.log("Beneficiaries confirmed");

    const policy = await PolicyManagement.policyRegister(policyHash, {
      from: accounts[0],
    });

    const premium = policy.premiumAmount;

    console.log(
      `Policy premium : ${parseInt(web3.utils.fromWei(premium))} DAI`
    );

    // pay initial premium and activate Policy

    await dai.approve(LiquidityManagement.address, premium, {
      from: accounts[1],
    });
    await PolicyManagement.firstPaymentAndActivation(policyHash, {
      from: accounts[1],
    });

    const funds = await InvestmentManagement.getInvestedFunds();

    console.log(
      `Funds invested in Aave and Compound : ${web3.utils.fromWei(funds)}`
    );

    totalLiabilities = await LiquidityManagement.totalLiabilities();
    console.log(`totalLiabilities: ${web3.utils.fromWei(totalLiabilities)}`);
    minimumCapitalReserve = await LiquidityManagement.minimumCapitalReserve();
    console.log(
      `minimumCapitalReserve: ${web3.utils.fromWei(minimumCapitalReserve)}`
    );
    lowerLiquidityLimit = await LiquidityManagement.lowerLiquidityLimit();
    console.log(
      `lowerLiquidityLimit: ${web3.utils.fromWei(lowerLiquidityLimit)}`
    );
    higherLiquidityLimit = await LiquidityManagement.higherLiquidityLimit();
    console.log(
      `higherLiquidityLimit: ${web3.utils.fromWei(higherLiquidityLimit)}`
    );
    currentLiquidityReserves = await LiquidityManagement.currentLiquidityReserves();
    console.log(
      `currentLiquidityReserves: ${web3.utils.fromWei(
        currentLiquidityReserves
      )}`
    );

    const daiBalance4preWithdraw = await dai.balanceOf(accounts[4]);
    console.log(
      `DAI balance 4 before withdraw : ${web3.utils.fromWei(
        daiBalance4preWithdraw
      )}`
    );
    const daiBalance1preWithdraw = await dai.balanceOf(accounts[1]);
    console.log(
      `DAI balance 1 before withdraw : ${web3.utils.fromWei(
        daiBalance1preWithdraw
      )}`
    );
        
    /* TEST FOR FUNDS WITHDRAWAL VIA TOKEN BUY BACK 

    // withdraw funds via token buyback
    const CHERISHtoken4 = await LiquidityManagement.balanceOf(accounts[4]);
    console.log(
      `Account 4 CHERISH balance : ${web3.utils.fromWei(CHERISHtoken4)}`
    );

    await LiquidityManagement.withdrawLiquidityViaBuyback(CHERISHtoken4, {
      from: accounts[4],
    });
    console.log("Funds withdrawn");

    totalLiabilities = await LiquidityManagement.totalLiabilities();
    console.log(`totalLiabilities: ${web3.utils.fromWei(totalLiabilities)}`);
    minimumCapitalReserve = await LiquidityManagement.minimumCapitalReserve();
    console.log(
      `minimumCapitalReserve: ${web3.utils.fromWei(minimumCapitalReserve)}`
    );
    lowerLiquidityLimit = await LiquidityManagement.lowerLiquidityLimit();
    console.log(
      `lowerLiquidityLimit: ${web3.utils.fromWei(lowerLiquidityLimit)}`
    );
    higherLiquidityLimit = await LiquidityManagement.higherLiquidityLimit();
    console.log(
      `higherLiquidityLimit: ${web3.utils.fromWei(higherLiquidityLimit)}`
    );
    currentLiquidityReserves = await LiquidityManagement.currentLiquidityReserves();
    console.log(
      `currentLiquidityReserves: ${web3.utils.fromWei(
        currentLiquidityReserves
      )}`
    );
    const fundsAfterWithdraw = await InvestmentManagement.getInvestedFunds();
    console.log(
      `Invested Funds after withdrawal: ${web3.utils.fromWei(
        fundsAfterWithdraw
      )}`
    );

    */

    /* TEST FOR FUNDS SYSTEM SHUTDOWN 
    // system shutdown
    await LiquidityManagement.toggleSystemPause();
    await LiquidityManagement.systemShutdown();

    const daiBalance4afterWithdraw = await dai.balanceOf(accounts[4]);
    console.log(
      `DAI balance 4 after withdraw : ${web3.utils.fromWei(
        daiBalance4afterWithdraw
      )}`
    );
    const daiBalance1afterWithdraw = await dai.balanceOf(accounts[1]);
    console.log(
      `DAI balance 1 after withdraw : ${web3.utils.fromWei(
        daiBalance1afterWithdraw
      )}`
    );

    const daiBalanceInvMgt = await dai.balanceOf(InvestmentManagement.address);
    console.log(
      `Investment Management DAI balance : ${daiBalanceInvMgt.toString()}`
    );

    const daiBalanceLiqMgt = await dai.balanceOf(LiquidityManagement.address);
    console.log(
      `Liquidity Management DAI balance : ${daiBalanceLiqMgt.toString()}`
    );
    */

  

  });
});
