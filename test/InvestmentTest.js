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

    console.log(`Initial Account 0 DAI balance : ${daiBalance0}`);

    let daiBalance1 = await dai.balanceOf(accounts[1]);
    daiBalance1 = parseInt(web3.utils.fromWei(daiBalance1));

    console.log(`Account 1 DAI balance : ${daiBalance1}`);

    await dai.approve(
      InvestmentManagement.address,
      web3.utils.toWei(daiBalance0.toString()),
      {
        from: accounts[0],
      }
    );
    await dai.transfer(
      InvestmentManagement.address,
      web3.utils.toWei(daiBalance0.toString()),
      {
        from: accounts[0],
      }
    );
    await InvestmentManagement._addFundsForInvestment(
      web3.utils.toWei(daiBalance0.toString()),
      {
        from: accounts[0],
      }
    );

    console.log("Funds deposited");

    let idaiBalance0 = await dai.balanceOf(accounts[0]);
    idaiBalance0 = parseInt(web3.utils.fromWei(idaiBalance0));

    console.log(`Intermediate Account 0 DAI balance : ${idaiBalance0}`);

    const funds = await InvestmentManagement.getInvestedFunds();
    console.log(funds.toString());

    console.log(`Funds invested in Aave and Curve : ${funds.toString()}`);

    await InvestmentManagement._withdrawInvestedFunds(
      web3.utils.toWei(daiBalance0.toString())
    );

    console.log("Funds withdrawn");

    let fdaiBalance0 = await dai.balanceOf(LiquidityManagement.address);
    fdaiBalance0 = parseInt(web3.utils.fromWei(fdaiBalance0));

    console.log(`Final Liquidity Management balance : ${fdaiBalance0}`);
  });
});
