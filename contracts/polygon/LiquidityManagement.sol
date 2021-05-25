pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ContractRegistry.sol";
import "./InvestmentManagement.sol";

contract LiquidityManagement is ERC20("CherishToken", "CHERISH") {
    using SafeMath for uint256;

    // interfaces & contract instantiations

    IERC20 public paymentToken;
    ContractRegistry public contractRegistry;
    InvestmentManagement public investmentManagement;

    // events

    event ContractRegistryInitiated(uint256 date, address _contractRegistry);
    event ContractOpenedForContributions(uint256 date);
    event ContributionsClosedContractActive(
        uint256 date,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves
    );
    event SystemPauseToggled(uint256 date, ContractState);
    event SystemShutdown(uint256 date, ContractState);
    event LiquidityAddedViaContribution(
        uint256 date,
        address _contributor,
        uint256 _amount,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves
    );
    event NewPolicyAdded(
        uint256 date,
        uint256 _liability,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves,
        uint256 _totalLiabilities,
        uint256 _minimumCapitalReserve,
        uint256 _lowerLiquidityLimit,
        uint256 _higherLiquidityLimit
    );
    event PremiumReceived(
        uint256 date,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves
    );
    event LiquidityWithdrawnViaBuyback(
        uint256 date,
        address _withdrawer,
        uint256 _payout,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves
    );
    event LiquidityWithdrawnViaPayout(
        uint256 date,
        address _beneficiary,
        uint256 _payout,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves
    );
    event LiabilityRemoved(
        uint256 date,
        uint256 _payout,
        uint256 _currentLiquidityReserves,
        uint256 _totalAvailableReserves
    );

    // enums and structs

    enum ContractState {
        Deployed,
        AwaitingContributions,
        Functioning,
        Paused,
        Shutdown
    }

    // contract variables in storage

    address contractOwner;
    uint256 public totalLiabilities;
    uint256 public minimumCapitalReserve;
    uint256 public lowerLiquidityLimit;
    uint256 public higherLiquidityLimit;
    uint256 public currentLiquidityReserves;
    ContractState public currentContractState;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    address[] private tokenholders;

    uint256 private _totalSupply;

    // modifiers

    modifier onlyOwner() {
        require(
            msg.sender == contractOwner,
            "Only the contract owner can call this function"
        );
        _;
    }

    modifier onlyPolMgt() {
        require(
            msg.sender == contractRegistry.policyManagementContract(),
            "Only the Policy Management contract can call this function"
        );
        _;
    }

    modifier notPaused() {
        require(
            currentContractState != ContractState.Paused,
            "The contract is paused"
        );
        _;
    }

    // constructor function

    constructor() public {
        contractOwner = msg.sender;
        currentContractState = ContractState.Deployed;
        totalLiabilities = 0;
        lowerLiquidityLimit = 0;
        higherLiquidityLimit = 0;
        currentLiquidityReserves = 0;
    }

    // test/admin functions

    function setContractRegistryAndAddresses(address _contractRegistry)
        public
        onlyOwner
    {
        require(
            _contractRegistry != address(0),
            "Contract Registry address must be a valid address"
        );
        require(
            currentContractState == ContractState.Deployed,
            "Contract Registry can only be set at Deployed stage"
        );
        _setContractRegistryAndAddresses(_contractRegistry);
    }

    function openContractForContributions() public onlyOwner {
        require(
            currentContractState == ContractState.Deployed,
            "This transition can only be set at Deployed stage"
        );
        _openContractForContributions();
    }

    function closeContributionsAndActivate() public onlyOwner {
        require(
            currentContractState == ContractState.AwaitingContributions,
            "This transition can only be set at AwaitingContributions stage"
        );
        _closeContributionsAndActivate();
    }

    function toggleSystemPause() public onlyOwner {
        require(
            currentContractState == ContractState.Functioning ||
                currentContractState == ContractState.Paused,
            "This transition can only be set at Functioning stage"
        );
        _toggleSystemPause();
    }

    function systemShutdown() public onlyOwner {
        require(
            currentContractState == ContractState.Functioning ||
                currentContractState == ContractState.Paused,
            "This transition can only be set at Functioning or Paused stage"
        );
        _systemShutdown();
    }

    // public functions

    function addInitialLiquidityViaInitialContribution(uint256 _amount) public {
        require(currentContractState == ContractState.AwaitingContributions);
        require(_amount > 0, "Contribution amount must be superior to 0");

        address contributor = msg.sender;

        _addLiquidityViaContribution(contributor, _amount);
    }

    function addLiquidityViaRecapitalization(uint256 _amount) public {
        require(currentContractState == ContractState.Functioning);
        require(_amount > 0, "Contribution amount must be superior to 0");
        address contributor = msg.sender;
        _addLiquidityViaContribution(contributor, _amount);
    }

    function addNewPolicy(
        address _policyholder,
        uint256 _initialPremium,
        uint256 _liability
    ) public notPaused onlyPolMgt {
        require(currentContractState == ContractState.Functioning);
        _addNewPolicy(_policyholder, _initialPremium, _liability);
    }

    function addLiquidityViaPremium(address _policyholder, uint256 _premium)
        public
        notPaused
        onlyPolMgt
    {
        _addLiquidityViaPremium(_policyholder, _premium);
    }

    function withdrawLiquidityViaPayout(address _beneficiary, uint256 _payout)
        public
        notPaused
        onlyPolMgt
    {
        _withdrawLiquidityViaPayout(_beneficiary, _payout);
    }

    function removeLiability(uint256 _liability) public notPaused onlyPolMgt {
        _removeLiability(_liability);
    }

    function withdrawLiquidityViaBuyback(uint256 _amount) public {
        // _amount refers here to the number of CHERISH tokens to be burned in exchange for payment tokens
        require(_amount > 0, "Withdrawal amount must be superior to 0");
        require(
            balanceOf(msg.sender) >= _amount,
            "CHERISH balance insufficient"
        );

        address withdrawer = msg.sender;
        _withdrawLiquidityViaBuyback(withdrawer, _amount, false);
    }

    function getTotalAvailableReserves() public view returns (uint256) {
        uint256 totalAvailableReserves;
        totalAvailableReserves = currentLiquidityReserves.add(
            investmentManagement.getInvestedFunds()
        );
        return totalAvailableReserves;
    }

    // private functions

    function _setContractRegistryAndAddresses(address _contractRegistry)
        private
    {
        contractRegistry = ContractRegistry(_contractRegistry);
        paymentToken = IERC20(contractRegistry.paymentTokenContract());
        investmentManagement = InvestmentManagement(
            contractRegistry.investmentManagementContract()
        );

        emit ContractRegistryInitiated(now, _contractRegistry);
    }

    function _openContractForContributions() private {
        currentContractState = ContractState.AwaitingContributions;
        emit ContractOpenedForContributions(now);
    }

    function _closeContributionsAndActivate() private {
        currentContractState = ContractState.Functioning;

        uint256 totalAvailableReserves = getTotalAvailableReserves();
        emit ContributionsClosedContractActive(
            now,
            currentLiquidityReserves,
            totalAvailableReserves
        );
    }

    function _toggleSystemPause() private {
        if (currentContractState == ContractState.Functioning) {
            currentContractState = ContractState.Paused;
        } else if (currentContractState == ContractState.Paused) {
            currentContractState = ContractState.Functioning;
        }

        emit SystemPauseToggled(now, currentContractState);
    }

    function _systemShutdown() private {
        currentContractState = ContractState.Shutdown;

        for (uint256 i = 0; i < tokenholders.length; i++) {
            _withdrawLiquidityViaBuyback(
                tokenholders[i],
                balanceOf(tokenholders[i]),
                true
            );
        }

        emit SystemShutdown(now, currentContractState);
    }

    function _addLiquidityViaContribution(address _contributor, uint256 _amount)
        private
    {
        paymentToken.transferFrom(_contributor, address(this), _amount);

        _mint(_contributor, _amount);

        tokenholders.push(_contributor);
        currentLiquidityReserves = currentLiquidityReserves.add(_amount);

        if (currentLiquidityReserves > higherLiquidityLimit) {
            uint256 diff2higher =
                currentLiquidityReserves.sub(higherLiquidityLimit);
            uint256 higher2average =
                (higherLiquidityLimit.sub(lowerLiquidityLimit)).div(2);
            uint256 additionToInvest = diff2higher.add(higher2average);

            // send payment tokens to InvestmentManagement contract
            paymentToken.approve(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            paymentToken.transfer(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            investmentManagement.addFundsForInvestment(additionToInvest);
            currentLiquidityReserves = currentLiquidityReserves.sub(
                additionToInvest
            );
        }

        assert(currentLiquidityReserves <= higherLiquidityLimit);
        assert(
            currentLiquidityReserves == paymentToken.balanceOf(address(this))
        );

        uint256 totalAvailableReserves = getTotalAvailableReserves();
        emit LiquidityAddedViaContribution(
            now,
            _contributor,
            _amount,
            currentLiquidityReserves,
            totalAvailableReserves
        );
    }

    function _withdrawLiquidityViaBuyback(
        address _withdrawer,
        uint256 _amount,
        bool _shutdown
    ) private {
        // _amount refers here to the number of CHERISH tokens to be burned
        uint256 currentTotalAvailableReserves = getTotalAvailableReserves();
        uint256 withdrawal =
            _amount.mul(currentTotalAvailableReserves).div(totalSupply()); // token share = _amount / totalSupply()

        if (_shutdown == false) {
            require(
                currentTotalAvailableReserves.sub(withdrawal) >=
                    minimumCapitalReserve,
                "Cannot withdraw beyond Mininimum Capital Reserve"
            );
        }

        if (withdrawal > currentLiquidityReserves) {
            uint256 minimumWithdrawal =
                withdrawal.sub(currentLiquidityReserves);
            uint256 targetAverage =
                (higherLiquidityLimit.add(lowerLiquidityLimit)).div(2);
            // draw payment tokens from InvestmentManagement contract
            uint256 withdrawalFromInvest = minimumWithdrawal.add(targetAverage);
            investmentManagement.withdrawInvestedFunds(
                withdrawalFromInvest,
                _shutdown
            );
            currentLiquidityReserves = targetAverage;
        } else if (
            (currentLiquidityReserves.sub(withdrawal)) < lowerLiquidityLimit
        ) {
            currentLiquidityReserves = currentLiquidityReserves.sub(withdrawal);
            uint256 diff2lower =
                lowerLiquidityLimit.sub(currentLiquidityReserves);
            uint256 lower2average =
                (higherLiquidityLimit.sub(lowerLiquidityLimit)).div(2);
            uint256 withdrawalFromInvest = diff2lower.add(lower2average);
            // draw payment tokens from InvestmentManagement contract
            investmentManagement.withdrawInvestedFunds(
                withdrawalFromInvest,
                _shutdown
            );
            currentLiquidityReserves = currentLiquidityReserves.add(
                withdrawalFromInvest
            );
        } else {
            currentLiquidityReserves = currentLiquidityReserves.sub(withdrawal);
        }

        if (_shutdown == false) {
            assert(currentLiquidityReserves >= lowerLiquidityLimit);
        }

        if (
            _shutdown == true &&
            paymentToken.balanceOf(address(this)) < withdrawal
        ) {
            paymentToken.approve(
                _withdrawer,
                paymentToken.balanceOf(address(this))
            );
            paymentToken.transfer(
                _withdrawer,
                paymentToken.balanceOf(address(this))
            );
            currentLiquidityReserves = 0;
        } else {
            paymentToken.approve(_withdrawer, withdrawal);
            paymentToken.transfer(_withdrawer, withdrawal);
        }

        if (_shutdown == false) {
            assert(
                currentLiquidityReserves ==
                    paymentToken.balanceOf(address(this))
            );
        }

        uint256 newTotalAvailableReserves = getTotalAvailableReserves();

        emit LiquidityWithdrawnViaBuyback(
            now,
            _withdrawer,
            withdrawal,
            currentLiquidityReserves,
            newTotalAvailableReserves
        );

        _burn(_withdrawer, _amount);
    }

    function _addNewPolicy(
        address _policyholder,
        uint256 _initialPremium,
        uint256 _liability
    ) private {
        paymentToken.transferFrom(
            _policyholder,
            address(this),
            _initialPremium
        );

        totalLiabilities = totalLiabilities.add(_liability);
        minimumCapitalReserve = minimumCapitalReserve.add(
            _liability.mul(15).div(100)
        ); // MCR must be 15% of all liabilities

        lowerLiquidityLimit = minimumCapitalReserve
            .mul(10)
            .mul(80)
            .div(100)
            .div(100); // liquidity reserve set at 10% of MCR, 80% being the lower band
        higherLiquidityLimit = minimumCapitalReserve
            .mul(10)
            .mul(120)
            .div(100)
            .div(100); // higher band at 120%

        currentLiquidityReserves = currentLiquidityReserves.add(
            _initialPremium
        );

        if (currentLiquidityReserves > higherLiquidityLimit) {
            uint256 diff2higher =
                currentLiquidityReserves.sub(higherLiquidityLimit);
            uint256 higher2average =
                (higherLiquidityLimit.sub(lowerLiquidityLimit)).div(2);
            uint256 additionToInvest = diff2higher.add(higher2average);
            // send payment tokens to InvestmentManagement contract
            paymentToken.approve(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            paymentToken.transfer(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            investmentManagement.addFundsForInvestment(additionToInvest);
            currentLiquidityReserves = currentLiquidityReserves.sub(
                additionToInvest
            );
        }

        assert(currentLiquidityReserves <= higherLiquidityLimit);
        assert(
            currentLiquidityReserves == paymentToken.balanceOf(address(this))
        );

        uint256 totalAvailableReserves = getTotalAvailableReserves();

        emit NewPolicyAdded(
            now,
            _liability,
            currentLiquidityReserves,
            totalAvailableReserves,
            totalLiabilities,
            minimumCapitalReserve,
            lowerLiquidityLimit,
            higherLiquidityLimit
        );
    }

    function _addLiquidityViaPremium(address _policyholder, uint256 _premium)
        private
    {
        paymentToken.transferFrom(
            _policyholder,
            contractRegistry.liquidityManagementContract(),
            _premium
        );

        currentLiquidityReserves = currentLiquidityReserves.add(_premium);

        if (currentLiquidityReserves > higherLiquidityLimit) {
            uint256 diff2higher =
                currentLiquidityReserves.sub(higherLiquidityLimit);
            uint256 higher2average =
                (higherLiquidityLimit.sub(lowerLiquidityLimit)).div(2);
            uint256 additionToInvest = diff2higher.add(higher2average);
            // send payment tokens to InvestmentManagement contract
            paymentToken.approve(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            paymentToken.transfer(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            investmentManagement.addFundsForInvestment(additionToInvest);
            currentLiquidityReserves = currentLiquidityReserves.sub(
                additionToInvest
            );
        }

        assert(currentLiquidityReserves <= higherLiquidityLimit);
        assert(
            currentLiquidityReserves == paymentToken.balanceOf(address(this))
        );

        uint256 totalAvailableReserves = getTotalAvailableReserves();

        emit PremiumReceived(
            now,
            currentLiquidityReserves,
            totalAvailableReserves
        );
    }

    function _withdrawLiquidityViaPayout(address _beneficiary, uint256 _payout)
        private
    {
        totalLiabilities = totalLiabilities.sub(_payout);
        minimumCapitalReserve = minimumCapitalReserve.sub(
            _payout.mul(15).div(100)
        ); // MCR must be 15% of all liabilities

        lowerLiquidityLimit = minimumCapitalReserve
            .mul(10)
            .mul(80)
            .div(100)
            .div(100); // liquidity reserve set at 10% of MCR, 80% being the lower band
        higherLiquidityLimit = minimumCapitalReserve
            .mul(10)
            .mul(120)
            .div(100)
            .div(100); // higher band at 120%

        if (_payout > currentLiquidityReserves) {
            uint256 minimumWithdrawal = _payout.sub(currentLiquidityReserves);
            uint256 targetAverage =
                (higherLiquidityLimit.add(lowerLiquidityLimit)).div(2);
            // draw payment tokens from InvestmentManagement contract
            uint256 withdrawalFromInvest = minimumWithdrawal.add(targetAverage);
            investmentManagement.withdrawInvestedFunds(
                withdrawalFromInvest,
                false
            );
            currentLiquidityReserves = targetAverage;
        } else if (
            (currentLiquidityReserves.sub(_payout)) < lowerLiquidityLimit
        ) {
            currentLiquidityReserves = currentLiquidityReserves.sub(_payout);
            uint256 diff2lower =
                lowerLiquidityLimit.sub(currentLiquidityReserves);
            uint256 lower2average =
                (higherLiquidityLimit.sub(lowerLiquidityLimit)).div(2);
            uint256 withdrawalFromInvest = diff2lower.add(lower2average);
            // draw payment tokens from InvestmentManagement contract
            investmentManagement.withdrawInvestedFunds(
                withdrawalFromInvest,
                false
            );
            currentLiquidityReserves = currentLiquidityReserves.add(
                withdrawalFromInvest
            );
        } else {
            currentLiquidityReserves = currentLiquidityReserves.sub(_payout);
        }

        assert(currentLiquidityReserves >= lowerLiquidityLimit);

        paymentToken.approve(_beneficiary, _payout);
        paymentToken.transfer(_beneficiary, _payout);

        assert(
            currentLiquidityReserves == paymentToken.balanceOf(address(this))
        );

        uint256 totalAvailableReserves = getTotalAvailableReserves();

        emit LiquidityWithdrawnViaPayout(
            now,
            _beneficiary,
            _payout,
            currentLiquidityReserves,
            totalAvailableReserves
        );

        // TO DELETE - used for testing purposes
        /*
        currentLiquidityReserves = currentLiquidityReserves.sub(_payout);

        paymentToken.approve(_beneficiary, _payout);
        paymentToken.transfer(_beneficiary, _payout);
        assert(
            currentLiquidityReserves == paymentToken.balanceOf(address(this))
        );
        */
    }

    function _removeLiability(uint256 _liability) private {
        totalLiabilities = totalLiabilities.sub(_liability);
        minimumCapitalReserve = minimumCapitalReserve.sub(
            _liability.mul(15).div(100)
        ); // MCR must be 15% of all liabilities

        lowerLiquidityLimit = minimumCapitalReserve
            .mul(10)
            .mul(80)
            .div(100)
            .div(100); // liquidity reserve set at 10% of MCR, 80% being the lower band
        higherLiquidityLimit = minimumCapitalReserve
            .mul(10)
            .mul(120)
            .div(100)
            .div(100); // higher band at 120%

        if (currentLiquidityReserves > higherLiquidityLimit) {
            uint256 diff2higher =
                currentLiquidityReserves.sub(higherLiquidityLimit);
            uint256 higher2average =
                (higherLiquidityLimit.sub(lowerLiquidityLimit)).div(2);
            uint256 additionToInvest = diff2higher.add(higher2average);
            // send payment tokens to InvestmentManagement contract
            paymentToken.approve(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            paymentToken.transfer(
                contractRegistry.investmentManagementContract(),
                additionToInvest
            );
            investmentManagement.addFundsForInvestment(additionToInvest);
            currentLiquidityReserves = currentLiquidityReserves.sub(
                additionToInvest
            );
        }

        assert(currentLiquidityReserves <= higherLiquidityLimit);
        assert(
            currentLiquidityReserves == paymentToken.balanceOf(address(this))
        );

        uint256 totalAvailableReserves = getTotalAvailableReserves();

        emit LiabilityRemoved(
            now,
            _liability,
            currentLiquidityReserves,
            totalAvailableReserves
        );
    }
}
