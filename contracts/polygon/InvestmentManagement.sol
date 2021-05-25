pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ContractRegistry.sol";

interface StableSwapAave {
    function add_liquidity(
        uint256[3] memory,
        uint256,
        bool
    ) external returns (uint256);

    function remove_liquidity_imbalance(
        uint256[3] memory,
        uint256,
        bool
    ) external returns (uint256);

    function remove_liquidity_one_coin(
        uint256,
        int128,
        uint256,
        bool
    ) external returns (uint256);

    function get_virtual_price() external view returns (uint256);
}

interface CurveLPtoken {
    function balanceOf(address) external view returns (uint256);
}

interface AaveLendingPool {
    function deposit(
        address,
        uint256,
        address,
        uint16
    ) external;

    function withdraw(
        address,
        uint256,
        address
    ) external;
}

interface AavePaymentToken {
    function balanceOf(address) external view returns (uint256);
}

contract InvestmentManagement {
    using SafeMath for uint256;

    // interfaces & contract instantiations

    IERC20 public paymentToken;
    StableSwapAave public stableSwapAave;
    CurveLPtoken public curveLPtoken;
    AaveLendingPool public aaveLendingPool;
    AavePaymentToken public aavePaymentToken;
    ContractRegistry public contractRegistry;

    // events

    event ContractRegistryInitiated(uint256 date, address _contractRegistry);
    event FundsWithdrawnFromCurve(uint256 date, uint256 _amount);
    event FundsWithdrawnFromAave(uint256 date, uint256 _amount);
    event FundsAddedToCurve(uint256 date, uint256 _amount);
    event FundsAddedToAave(uint256 date, uint256 _amount);

    // enums and structs

    // contract variables in storage

    address contractOwner;

    // modifiers

    modifier onlyOwner() {
        require(
            msg.sender == contractOwner,
            "Only the contract owner can call this function"
        );
        _;
    }

    modifier onlyLiqMgt() {
        require(
            msg.sender == contractRegistry.liquidityManagementContract(),
            "Only the liquidity management contract can call this function"
        );
        _;
    }

    // constructor function

    constructor() public {
        contractOwner = msg.sender;
    }

    // test/admin functions

    // public functions

    function setContractRegistryAndAddresses(address _contractRegistry)
        public
        onlyOwner
    {
        require(
            _contractRegistry != address(0),
            "Contract Registry address must be a valid address"
        );
        _setContractRegistryAndAddresses(_contractRegistry);
    }

    function withdrawInvestedFunds(uint256 _amount, bool _shutdown)
        public
        onlyLiqMgt
    {
        _withdrawInvestedFunds(_amount, _shutdown);
    }

    function addFundsForInvestment(uint256 _amount) public onlyLiqMgt {
        _addFundsForInvestment(_amount);
    }

    function getInvestedFunds() public view returns (uint256) {
        uint256 investedFunds;

        uint256 aaveFunds = aavePaymentToken.balanceOf(address(this));

        uint256 curveFunds =
            (curveLPtoken.balanceOf(address(this)) *
                stableSwapAave.get_virtual_price()) / (10**18);

        investedFunds = aaveFunds.add(curveFunds);

        return investedFunds;
    }

    // private functions

    function _setContractRegistryAndAddresses(address _contractRegistry)
        private
    {
        contractRegistry = ContractRegistry(_contractRegistry);
        paymentToken = IERC20(contractRegistry.paymentTokenContract());
        stableSwapAave = StableSwapAave(contractRegistry.curveAddresses(0));
        curveLPtoken = CurveLPtoken(contractRegistry.curveAddresses(1));
        aaveLendingPool = AaveLendingPool(contractRegistry.aaveAddresses(0));
        aavePaymentToken = AavePaymentToken(contractRegistry.aaveAddresses(1));

        emit ContractRegistryInitiated(now, _contractRegistry);
    }

    function _withdrawInvestedFunds(uint256 _amount, bool _shutdown) private {
        uint256 firstHalf = _amount.div(2);
        uint256 secondHalf = _amount.sub(firstHalf);

        // withdraw half of the funds from Curve
        uint256 curveFunds =
            (curveLPtoken.balanceOf(address(this)) *
                stableSwapAave.get_virtual_price()) / (10**18);

        if (firstHalf <= curveFunds) {
            stableSwapAave.remove_liquidity_imbalance(
                [firstHalf, 0, 0],
                curveLPtoken.balanceOf(address(this)),
                true
            ); // maximum LP token burn set to contract LP token balance
            emit FundsWithdrawnFromCurve(now, firstHalf);
        } else if (_shutdown == true) {
            uint256 fundsWithdrawn =
                stableSwapAave.remove_liquidity_one_coin(
                    curveLPtoken.balanceOf(address(this)),
                    0,
                    0,
                    true
                ); // N.B : minimum set to zero ! (security risk)
            emit FundsWithdrawnFromCurve(now, fundsWithdrawn);
        } else {
            revert("Insufficient funds in Curve");
        }

        // withdraw other half of the funds from Aave
        uint256 aaveFunds = aavePaymentToken.balanceOf(address(this));

        if (secondHalf <= aaveFunds) {
            aaveLendingPool.withdraw(
                contractRegistry.paymentTokenContract(),
                secondHalf,
                address(this)
            );
            emit FundsWithdrawnFromAave(now, secondHalf);
        } else if (_shutdown == true) {
            aaveLendingPool.withdraw(
                contractRegistry.paymentTokenContract(),
                aaveFunds,
                address(this)
            );
            emit FundsWithdrawnFromAave(now, aaveFunds);
        } else {
            revert("Insufficient funds in Aave");
        }

        // send funds to Liquidity Management Contract
        if (
            _shutdown == true && paymentToken.balanceOf(address(this)) < _amount
        ) {
            paymentToken.approve(
                contractRegistry.liquidityManagementContract(),
                paymentToken.balanceOf(address(this))
            );
            paymentToken.transfer(
                contractRegistry.liquidityManagementContract(),
                paymentToken.balanceOf(address(this))
            );
        } else {
            paymentToken.approve(
                contractRegistry.liquidityManagementContract(),
                _amount
            );
            paymentToken.transfer(
                contractRegistry.liquidityManagementContract(),
                _amount
            );
        }
    }

    function _addFundsForInvestment(uint256 _amount) private {
        uint256 firstHalf = _amount.div(2);
        uint256 secondHalf = _amount.sub(firstHalf);

        // place half of the funds into Curve
        paymentToken.approve(contractRegistry.curveAddresses(0), firstHalf);
        stableSwapAave.add_liquidity([firstHalf, 0, 0], 0, true); // N.B : minimum set to zero ! (security risk)
        emit FundsAddedToCurve(now, firstHalf);

        // place other half of the funds into aaveLendingPool

        paymentToken.approve(contractRegistry.aaveAddresses(0), secondHalf);
        aaveLendingPool.deposit(
            contractRegistry.paymentTokenContract(),
            secondHalf,
            address(this),
            0
        );
        emit FundsAddedToAave(now, secondHalf);
    }
}
