pragma solidity >=0.4.21 <0.7.0;

contract ContractRegistry {
    // modifier

    modifier onlyOwner() {
        require(
            msg.sender == contractOwner,
            "Only the contract owner can call this function"
        );
        _;
    }

    // events

    event PolicyManagementContractChanged(uint256 date, address _newAddress);
    event LiquidityManagementContractChanged(uint256 date, address _newAddress);
    event InvestmentManagementContractChanged(
        uint256 date,
        address _newAddress
    );
    event ClaimsManagementContractChanged(uint256 date, address _newAddress);
    event PaymentTokenContractChanged(uint256 date, address _newAddress);
    event KYCproviderChanged(uint256 date, address _newAddress);

    event CurveAddressesChanged(uint256 date, address[] _newAddresses);
    event AaveAddressesChanged(uint256 date, address[] _newAddresses);

    // variables

    address public contractOwner;
    address public policyManagementContract;
    address public liquidityManagementContract;
    address public investmentManagementContract;
    address public claimsManagementContract;
    address public paymentTokenContract;
    address public KYCproviderAddress;
    address[] public curveAddresses;
    address[] public aaveAddresses;

    // constructor

    constructor() public {
        contractOwner = msg.sender;
    }

    // address-setting functions;

    function setPolicyManagementContract(address _newAddress) public onlyOwner {
        policyManagementContract = _newAddress;
        emit PolicyManagementContractChanged(now, _newAddress);
    }

    function setLiquidityManagementContract(address _newAddress)
        public
        onlyOwner
    {
        liquidityManagementContract = _newAddress;
        emit LiquidityManagementContractChanged(now, _newAddress);
    }

    function setInvestmentManagementContract(address _newAddress)
        public
        onlyOwner
    {
        investmentManagementContract = _newAddress;
        emit InvestmentManagementContractChanged(now, _newAddress);
    }

    function setClaimsManagementContract(address _newAddress) public onlyOwner {
        claimsManagementContract = _newAddress;
        emit ClaimsManagementContractChanged(now, _newAddress);
    }

    function setPaymentTokenContract(address _newAddress) public onlyOwner {
        paymentTokenContract = _newAddress;
        emit PaymentTokenContractChanged(now, _newAddress);
    }

    function setKYCprovider(address _newAddress) public onlyOwner {
        KYCproviderAddress = _newAddress;
        emit KYCproviderChanged(now, _newAddress);
    }

    function setCurveAddresses(address[] memory _newAddresses)
        public
        onlyOwner
    {
        curveAddresses = _newAddresses;
        emit CurveAddressesChanged(now, _newAddresses);
    }

    function setAaveAddresses(address[] memory _newAddresses) public onlyOwner {
        aaveAddresses = _newAddresses;
        emit AaveAddressesChanged(now, _newAddresses);
    }
}
