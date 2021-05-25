const contractRegistry = artifacts.require("ContractRegistry");
const policyManagement = artifacts.require("PolicyManagement");
const liquidityManagement = artifacts.require("LiquidityManagement");
const investmentManagement = artifacts.require("InvestmentManagement");
const claimsManagement = artifacts.require("ClaimsManagement");
const uniswapRouter = artifacts.require("IUniswapV2Router02");
const daiContract = artifacts.require("Dai");
const compoundPaymentToken = artifacts.require("CompoundPaymentToken");
const aaveLendingPool = artifacts.require("AaveLendingPool");
const aavePaymentToken = artifacts.require("AavePaymentToken");

contract("LiquidityManagement", (accounts) => {
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

    // gets DAI from Uniswap for two accounts

    const uniswap = await uniswapRouter.at(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    await uniswap.swapExactETHForTokensSupportingFeeOnTransferTokens(
      100,
      [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
      ],
      accounts[0],
      1702133543,
      { from: accounts[0], value: web3.utils.toWei("10") }
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

    const dai = await daiContract.at(
      "0x6b175474e89094c44da98b954eedeac495271d0f"
    );

    let daiBalance0 = await dai.balanceOf(accounts[0]);
    daiBalance0 = parseInt(web3.utils.fromWei(daiBalance0));

    console.log(`Account 0 DAI balance : ${daiBalance0}`);

    let daiBalance1 = await dai.balanceOf(accounts[1]);
    daiBalance1 = parseInt(web3.utils.fromWei(daiBalance1));

    console.log(`Account 1 DAI balance : ${daiBalance1}`);

    // contributing to Compound and checking balances

    const compound = await compoundPaymentToken.at(
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
    );

    await dai.approve(
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
      web3.utils.toWei("1000"),
      { from: accounts[0] }
    );
    await compound.mint(web3.utils.toWei("1000"), { from: accounts[0] });

    let cDaiBalance0 = await compound.balanceOfUnderlying(accounts[0]);
    console.log(`Account 0 cDAI balance : ${cDaiBalance0.toString()}`);

    await dai.approve(
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
      web3.utils.toWei("500"),
      { from: accounts[1] }
    );
    await compound.mint(web3.utils.toWei("500"), { from: accounts[1] });

    let cDaiBalance1 = await compound.balanceOfUnderlying(accounts[1]);
    console.log(`Account 1 cDAI balance : ${cDaiBalance1.toString()}`);
    console.log(`Account 0 cDAI balance : ${cDaiBalance0.toString()}`);

    // contributing to Aave and checking balances

    const aave = await aaveLendingPool.at(
      "0x398eC7346DcD622eDc5ae82352F02bE94C62d119"
    );

    await dai.approve(
      "0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3",
      web3.utils.toWei("1000"),
      { from: accounts[0] }
    );
    await aave.deposit(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      web3.utils.toWei("1000"),
      0,
      { from: accounts[0] }
    );

    let aDaiBalance0 = await aave.getUserReserveData(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      accounts[0]
    );

    console.log(`Account 0 aDAI balance : ${aDaiBalance0["0"].toString()}`);

    await dai.approve(
      "0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3",
      web3.utils.toWei("500"),
      { from: accounts[1] }
    );
    await aave.deposit(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      web3.utils.toWei("500"),
      0,
      { from: accounts[1] }
    );

    let aDaiBalance1 = await aave.getUserReserveData(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      accounts[1]
    );
    console.log(`Account 1 aDAI balance : ${aDaiBalance1["0"].toString()}`);
    console.log(`Account 0 aDAI balance : ${aDaiBalance0["0"].toString()}`);

    let idaiBalance0 = await dai.balanceOf(accounts[0]);
    idaiBalance0 = parseInt(web3.utils.fromWei(idaiBalance0));

    console.log(`Account 0 DAI balance : ${idaiBalance0}`);

    let idaiBalance1 = await dai.balanceOf(accounts[1]);
    idaiBalance1 = parseInt(web3.utils.fromWei(idaiBalance1));

    console.log(`Account 1 DAI balance : ${idaiBalance1}`);

    // withdrawing compound and aave balances

    await compound.redeemUnderlying(cDaiBalance0, {
      from: accounts[0],
    });

    const aToken = await aavePaymentToken.at(
      "0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d"
    );

    await aToken.redeem(aDaiBalance0["0"], {
      from: accounts[0],
    });

    await compound.redeemUnderlying(cDaiBalance1, {
      from: accounts[1],
    });
    await aToken.redeem(aDaiBalance1["0"], {
      from: accounts[1],
    });

    let finalDaiBalance0 = await dai.balanceOf(accounts[0]);
    finalDaiBalance0 = parseInt(web3.utils.fromWei(finalDaiBalance0));

    console.log(`Account 0 DAI balance : ${finalDaiBalance0}`);

    let finalDaiBalance1 = await dai.balanceOf(accounts[1]);
    finalDaiBalance1 = parseInt(web3.utils.fromWei(finalDaiBalance1));

    console.log(`Account 1 DAI balance : ${finalDaiBalance1}`);
  });
});
