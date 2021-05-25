pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ContractRegistry.sol";
import "./LiquidityManagement.sol";
import "./ClaimsManagement.sol";

contract PolicyManagement {
    using SafeMath for uint256;

    // interfaces & contract instantiations

    IERC20 public paymentToken;
    ContractRegistry public contractRegistry;
    LiquidityManagement public liquidityManagement;
    ClaimsManagement public claimsManagement;

    // events

    event ContractRegistryInitiated(address _contractRegistryAddress);
    event QuoteConfirmed(uint256 date, bytes32 _policyIDhash);
    event KYCconfirmed(
        uint256 date,
        bytes32 _policyIDhash,
        string _KYCidentifier
    );
    event BeneficiariesAllocated(
        uint256 date,
        bytes32 _policyIDhash,
        address[] _beneficiaries
    );
    event BeneficiaryConfirmed(
        uint256 date,
        bytes32 _policyIDhash,
        address _beneficiary
    );
    event PolicyFullyConfirmed(uint256 date, bytes32 _policyIDhash);
    event PolicyActivated(
        uint256 date,
        bytes32 _policyIDhash,
        uint256 _premiumAmount
    );
    event PremiumPaid(
        uint256 date,
        bytes32 _policyIDhash,
        uint256 _premiumAmount
    );
    event PolicyCancelled(uint256 date, bytes32 _policyIDhash);
    event PolicyExpired(uint256 date, bytes32 _policyIDhash);
    event PolicyDelinquent(uint256 date, bytes32 _policyIDhash);
    event ClaimConfirmed(uint256 date, bytes32 indexed _policyIDhash);
    event ClaimRejected(uint256 date, bytes32 indexed _policyIDhash);
    event BeneficiaryPayoutWithdrawn(
        uint256 date,
        bytes32 _policyIDhash,
        address _beneficiary,
        uint256 _beneficiaryPayout
    );
    event PolicyFullyPaidOut(uint256 date, bytes32 _policyIDhash);

    // enums and structs
    enum PolicyStatus {
        Quoted,
        Allocated,
        Confirmed,
        Active,
        ClaimStarted,
        ClaimConfirmedByOracle,
        PaidOut,
        Delinquent,
        Cancelled,
        Expired
    }

    enum PaymentOptions {Monthly, Yearly}

    struct Policy {
        string policyID;
        address policyholder;
        address[] beneficiariesArray;
        mapping(address => uint8) beneficiaries; // beneficiary address is linked to a number representing its status (declared / confirmed)
        uint256 numberOfUnconfirmedBeneficiaries;
        mapping(address => uint8) beneficiariesShare;
        PolicyStatus currentPolicyStatus;
        uint256 lastPaymentDate;
        uint256 expiryDate;
        PaymentOptions selectedPaymentOption;
        uint256 payout;
        uint256 remainingPayout;
        uint256 premiumAmount;
        string KYCidentifier;
    }

    // contract variables in storage

    mapping(bytes32 => Policy) public policyRegister;
    mapping(address => bytes32) public ownerRegister;
    mapping(address => bytes32[]) public beneficiaryRegister;
    bytes32[] public policiesArray;
    address public contractOwner;

    // modifiers

    modifier onlyOwner() {
        require(
            msg.sender == contractOwner,
            "Only the contract owner can call this function"
        );
        _;
    }
    modifier onlyKYCprovider() {
        require(
            msg.sender == contractRegistry.KYCproviderAddress(),
            "Only the KYC provider can call this function"
        );
        _;
    }

    // constructor function

    constructor() public {
        contractOwner = msg.sender;
    }

    // test functions

    function changePolicyStatus(bytes32 _policyIDhash, uint256 _policyStatus)
        public
        onlyOwner
    {
        if (_policyStatus == 0) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Quoted;
        }
        if (_policyStatus == 1) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Allocated;
        }
        if (_policyStatus == 2) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Confirmed;
        }
        if (_policyStatus == 3) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Active;
        }
        if (_policyStatus == 4) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .ClaimStarted;
        }
        if (_policyStatus == 5) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .ClaimConfirmedByOracle;
        }
        if (_policyStatus == 6) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .PaidOut;
        }
        if (_policyStatus == 7) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Delinquent;
        }
        if (_policyStatus == 8) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Cancelled;
        }
        if (_policyStatus == 9) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Expired;
        }
    }

    function modifyLastPaymentDate(
        bytes32 _policyIDhash,
        bool isAdding,
        uint256 _days
    ) public onlyOwner {
        uint256 paymentDateTochange;

        if (isAdding) {
            paymentDateTochange = policyRegister[_policyIDhash]
                .lastPaymentDate
                .add(_days * 3600 * 24);
        } else {
            paymentDateTochange = policyRegister[_policyIDhash]
                .lastPaymentDate
                .sub(_days * 3600 * 24);
        }

        policyRegister[_policyIDhash].lastPaymentDate = paymentDateTochange;
    }

    function modifyExpiryDate(bytes32 _policyIDhash, uint256 _newExpiryDate)
        public
        onlyOwner
    {
        policyRegister[_policyIDhash].expiryDate = _newExpiryDate;
    }

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

    function getPolicyParameters(bytes32 _policyIDhash)
        public
        view
        returns (
            string memory policyID,
            address policyholder,
            uint256 currentPolicyStatus,
            string memory KYCidentifier,
            uint256 expiryDate
        )
    {
        return (
            policyRegister[_policyIDhash].policyID,
            policyRegister[_policyIDhash].policyholder,
            uint256(policyRegister[_policyIDhash].currentPolicyStatus),
            policyRegister[_policyIDhash].KYCidentifier,
            policyRegister[_policyIDhash].expiryDate
        );
    }

    function getPolicyFinancials(bytes32 _policyIDhash)
        public
        view
        returns (
            uint256 lastPaymentDate,
            uint256 selectedPaymentOption,
            uint256 payout,
            uint256 remainingPayout,
            uint256 premiumAmount
        )
    {
        return (
            policyRegister[_policyIDhash].lastPaymentDate,
            uint256(policyRegister[_policyIDhash].selectedPaymentOption),
            policyRegister[_policyIDhash].payout,
            policyRegister[_policyIDhash].remainingPayout,
            policyRegister[_policyIDhash].premiumAmount
        );
    }

    function getPolicyBeneficiariesArray(bytes32 _policyIDhash)
        public
        view
        returns (address[] memory beneficiariesArray)
    {
        address[] memory beneficiariesArray =
            policyRegister[_policyIDhash].beneficiariesArray;

        return beneficiariesArray;
    }

    function getBeneficiaryInfo(bytes32 _policyIDhash, address _beneficiary)
        public
        view
        returns (uint8 beneficiaryStatus, uint8 beneficiaryShare)
    {
        uint8 beneficiaryStatus =
            policyRegister[_policyIDhash].beneficiaries[_beneficiary];
        uint8 beneficiaryShare =
            policyRegister[_policyIDhash].beneficiariesShare[_beneficiary];

        return (beneficiaryStatus, beneficiaryShare);
    }

    function getBeneficiaryPoliciesArray(address _beneficiary)
        public
        view
        returns (bytes32[] memory beneficiaryPoliciesArray)
    {
        bytes32[] memory beneficiaryPoliciesArray =
            beneficiaryRegister[_beneficiary];

        return beneficiaryPoliciesArray;
    }

    function getPoliciesArray() public view returns (bytes32[] memory) {
        return policiesArray;
    }

    function quote(
        uint256 _age,
        bool _isSmoker,
        string memory _paymentOption,
        uint256 _payout
    ) public pure returns (uint256 premiumAmount) {
        return _quote(_age, _isSmoker, _paymentOption, _payout);
    }

    function confirmQuote(
        string memory _policyID,
        uint256 _age,
        bool _isSmoker,
        string memory _paymentOption,
        uint256 _payout
    ) public {
        bytes32 policyIDhash;
        policyIDhash = keccak256(abi.encodePacked(_policyID));
        require(
            policyRegister[policyIDhash].premiumAmount == 0,
            "This policy already exists"
        );

        address policyholder = msg.sender;

        uint256 premiumAmount =
            _quote(_age, _isSmoker, _paymentOption, _payout);

        _confirmQuote(
            _policyID,
            policyholder,
            _paymentOption,
            _payout,
            premiumAmount
        );
    }

    function setBeneficiaries(
        bytes32 _policyIDhash,
        address[] memory _beneficiaries,
        uint8[] memory _beneficiariesShare
    ) public {
        require(
            msg.sender == policyRegister[_policyIDhash].policyholder,
            "Only the policyholder can set beneficiaries"
        );
        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.Quoted,
            "Policy must be at the Quoted stage"
        );
        require(
            _beneficiaries.length == _beneficiariesShare.length,
            "beneficiaries and beneficiariesShare arrays must be of the same length"
        );
        _setBeneficiaries(_policyIDhash, _beneficiaries, _beneficiariesShare);
    }

    function confirmKYC(bytes32 _policyIDhash, string memory _KYCidentifier)
        public
        onlyKYCprovider
    {
        _confirmKYC(_policyIDhash, _KYCidentifier);
    }

    function confirmBeneficiary(bytes32 _policyIDhash) public {
        require(
            policyRegister[_policyIDhash].beneficiaries[msg.sender] == 1,
            "Only the beneficiary can confirm his allocated status"
        );
        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.Allocated,
            "Confirmation can only be done at the Allocated stage"
        );

        address _beneficiary = msg.sender;

        _confirmBeneficiary(_policyIDhash, _beneficiary);
    }

    function firstPaymentAndActivation(bytes32 _policyIDhash) public {
        require(
            msg.sender == policyRegister[_policyIDhash].policyholder,
            "Only the policyholder can activate the policy"
        );
        require(
            bytes(policyRegister[_policyIDhash].KYCidentifier).length > 0,
            "The policy owner's KYC must be verified"
        );
        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.Confirmed,
            "The policy must be at the Confirmed stage"
        );

        address policyholder = msg.sender;

        _firstPaymentAndActivation(_policyIDhash, policyholder);
    }

    function payPremium(bytes32 _policyIDhash) public {
        require(
            msg.sender == policyRegister[_policyIDhash].policyholder,
            "Only the policyholder can pay the premium of the policy"
        );
        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.Active,
            "The policy must be at the Active stage"
        );

        address policyholder = msg.sender;

        _payPremium(_policyIDhash, policyholder);
    }

    function cancelPolicy(bytes32 _policyIDhash) public {
        require(
            msg.sender == policyRegister[_policyIDhash].policyholder,
            "Only the policyholder can cancel the policy"
        );
        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.Active,
            "The policy must be at the Active stage"
        );
        _cancelPolicy(_policyIDhash);
    }

    function startClaim(bytes32 _policyIDhash) public {
        _updateAllPolicies();
        require(
            policyRegister[_policyIDhash].beneficiaries[msg.sender] == 2,
            "Only a confirmed beneficiary can start a claim"
        );

        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.Active,
            "The policy must be at the Active stage"
        );

        _startClaim(_policyIDhash);
    }

    function finalizeClaim(string memory _result, bytes32 _policyIDhash)
        public
    {
        require(
            msg.sender == contractRegistry.claimsManagementContract(),
            "Only the claims management contract can call this function"
        );

        _finalizeClaim(_result, _policyIDhash);
    }

    function updateAllPolicies() public onlyOwner {
        _updateAllPolicies();
    }

    function withdrawPayoutShare(bytes32 _policyIDhash) public {
        require(
            policyRegister[_policyIDhash].beneficiaries[msg.sender] == 2,
            "Only a confirmed beneficiary can withdraw a payout"
        );
        require(
            policyRegister[_policyIDhash].currentPolicyStatus ==
                PolicyStatus.ClaimConfirmedByOracle,
            "The claim must be confirmed by the Oracle"
        );
        address beneficiary = msg.sender;
        _withdrawPayoutShare(_policyIDhash, beneficiary);
    }

    // private functions

    function _setContractRegistryAndAddresses(address _contractRegistry)
        private
    {
        contractRegistry = ContractRegistry(_contractRegistry);
        paymentToken = IERC20(contractRegistry.paymentTokenContract());
        liquidityManagement = LiquidityManagement(
            contractRegistry.liquidityManagementContract()
        );
        claimsManagement = ClaimsManagement(
            contractRegistry.claimsManagementContract()
        );
        emit ContractRegistryInitiated(_contractRegistry);
    }

    function _quote(
        uint256 _age,
        bool _isSmoker,
        string memory _paymentOption,
        uint256 _payout
    ) private pure returns (uint256 _premiumAmount) {
        require(_age >= 18, "Quotation cannot be made for persons under 18");
        require(_age <= 60, "Quotation cannot be made for persons over 60");
        /* REMOVED FOR TESTING PURPOSES
        require(
            _payout >= 2000 * 10**18,
            "Quotation cannot be made for payouts under 2000"
        );
        */
        require(
            _payout <= 20000 * 10**18,
            "Quotation cannot be made for payouts over 20000"
        );

        if (_age >= 18 && _age <= 30) {
            _premiumAmount = 5;
        }

        if (_age > 30 && _age <= 40) {
            _premiumAmount = 10;
        }

        if (_age > 40 && _age <= 50) {
            _premiumAmount = 15;
        }

        if (_age > 50 && _age <= 60) {
            _premiumAmount = 20;
        }

        if (_isSmoker) {
            _premiumAmount = _premiumAmount.mul(15).div(10); // 50% additional charge on smokers
        }

        if (
            keccak256(abi.encodePacked(_paymentOption)) ==
            keccak256(abi.encodePacked("yearly"))
        ) {
            _premiumAmount = _premiumAmount.mul(12).mul(95).div(100); // 5% discount for choosing yearly payments
        }

        _premiumAmount = _premiumAmount.mul(_payout).div(2000);
    }

    function _confirmQuote(
        string memory _policyID,
        address _policyholder,
        string memory _paymentOption,
        uint256 _payout,
        uint256 _premiumAmount
    ) private {
        bytes32 policyIDhash;

        policyIDhash = keccak256(abi.encodePacked(_policyID));

        ownerRegister[msg.sender] = policyIDhash;

        Policy storage policy = policyRegister[policyIDhash];
        policy.policyID = _policyID;
        policy.selectedPaymentOption = PaymentOptions.Monthly;

        if (
            keccak256(abi.encodePacked(_paymentOption)) ==
            keccak256(abi.encodePacked("yearly"))
        ) {
            policy.selectedPaymentOption = PaymentOptions.Yearly;
        }

        policy.policyID = _policyID;
        policy.policyholder = _policyholder;
        // beneficiaries are added at next step Quoted --> Allocated
        policy.currentPolicyStatus = PolicyStatus.Quoted;
        // Monthly as default payment option, see above for other options
        policy.payout = _payout;
        policy.remainingPayout = _payout;
        policy.premiumAmount = _premiumAmount;
        // KYCidentifier is added at ulterior step

        policiesArray.push(policyIDhash);
        emit QuoteConfirmed(now, policyIDhash);
    }

    function _setBeneficiaries(
        bytes32 _policyIDhash,
        address[] memory _beneficiaries,
        uint8[] memory _beneficiariesShare
    ) private {
        uint256 check = 0;

        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            beneficiaryRegister[_beneficiaries[i]].push(_policyIDhash);

            policyRegister[_policyIDhash].beneficiaries[_beneficiaries[i]] = 1; // 1 stands for "declared"
            policyRegister[_policyIDhash].beneficiariesShare[
                _beneficiaries[i]
            ] = _beneficiariesShare[i];
            check = check.add(_beneficiariesShare[i]);
        }

        require(
            check == 100,
            "Beneficiaries' shares of payout do not add up to 100%"
        );

        policyRegister[_policyIDhash].beneficiariesArray = _beneficiaries;
        policyRegister[_policyIDhash]
            .numberOfUnconfirmedBeneficiaries = _beneficiaries.length;
        policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
            .Allocated;

        emit BeneficiariesAllocated(now, _policyIDhash, _beneficiaries);
    }

    function _confirmKYC(bytes32 _policyIDhash, string memory _KYCidentifier)
        private
    {
        policyRegister[_policyIDhash].KYCidentifier = _KYCidentifier;
        emit KYCconfirmed(now, _policyIDhash, _KYCidentifier);
    }

    function _confirmBeneficiary(bytes32 _policyIDhash, address _beneficiary)
        private
    {
        policyRegister[_policyIDhash].beneficiaries[_beneficiary] = 2; // 2 stands for "confirmed"
        policyRegister[_policyIDhash]
            .numberOfUnconfirmedBeneficiaries = policyRegister[_policyIDhash]
            .numberOfUnconfirmedBeneficiaries
            .sub(1);

        emit BeneficiaryConfirmed(now, _policyIDhash, _beneficiary);

        if (
            policyRegister[_policyIDhash].numberOfUnconfirmedBeneficiaries == 0
        ) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Confirmed;
            emit PolicyFullyConfirmed(now, _policyIDhash);
        }
    }

    function _firstPaymentAndActivation(
        bytes32 _policyIDhash,
        address _policyholder
    ) private {
        uint256 premiumAmount = policyRegister[_policyIDhash].premiumAmount;
        uint256 payout = policyRegister[_policyIDhash].payout;

        // approval from user towards Liquidity Management contract is necessary first
        liquidityManagement.addNewPolicy(_policyholder, premiumAmount, payout);

        policyRegister[_policyIDhash].lastPaymentDate = now;
        policyRegister[_policyIDhash].expiryDate = now.add(1825 days); // default policy is valid for five years
        policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus.Active;
        emit PolicyActivated(now, _policyIDhash, premiumAmount);
    }

    function _payPremium(bytes32 _policyIDhash, address _policyholder) private {
        uint256 premiumAmount = policyRegister[_policyIDhash].premiumAmount;

        if (
            policyRegister[_policyIDhash].selectedPaymentOption ==
            PaymentOptions.Monthly
        ) {
            require(
                now >=
                    policyRegister[_policyIDhash].lastPaymentDate.add(30 days),
                "Premium is not due yet"
            );

            // approval from user towards Liquidity Management contract is necessary first
            liquidityManagement.addLiquidityViaPremium(
                _policyholder,
                premiumAmount
            );
            policyRegister[_policyIDhash].lastPaymentDate = policyRegister[
                _policyIDhash
            ]
                .lastPaymentDate
                .add(30 days);
            emit PremiumPaid(now, _policyIDhash, premiumAmount);
        }

        if (
            policyRegister[_policyIDhash].selectedPaymentOption ==
            PaymentOptions.Yearly
        ) {
            require(
                now >=
                    policyRegister[_policyIDhash].lastPaymentDate.add(365 days),
                "Premium is not due yet"
            );

            // approval from user towards Liquidity Management contract is necessary first
            liquidityManagement.addLiquidityViaPremium(
                _policyholder,
                premiumAmount
            );
            policyRegister[_policyIDhash].lastPaymentDate = policyRegister[
                _policyIDhash
            ]
                .lastPaymentDate
                .add(365 days);
            emit PremiumPaid(now, _policyIDhash, premiumAmount);
        }
    }

    function _cancelPolicy(bytes32 _policyIDhash) private {
        policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
            .Cancelled;
        liquidityManagement.removeLiability(
            policyRegister[_policyIDhash].payout
        );
        emit PolicyCancelled(now, _policyIDhash);
    }

    function _startClaim(bytes32 _policyIDhash) private {
        policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
            .ClaimStarted;

        string storage _KYCidentifier =
            policyRegister[_policyIDhash].KYCidentifier;

        claimsManagement.getOracleConfirmation(_policyIDhash, _KYCidentifier);
    }

    function _finalizeClaim(string memory _result, bytes32 _policyIDhash)
        private
    {
        if (
            keccak256(abi.encodePacked(_result)) ==
            keccak256(abi.encodePacked("deceased"))
        ) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .ClaimConfirmedByOracle;
            emit ClaimConfirmed(now, _policyIDhash);
        } else {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .Active;
            emit ClaimRejected(now, _policyIDhash);
        }
    }

    function _updateAllPolicies() private {
        for (uint256 k = 0; k < policiesArray.length; k++) {
            if (
                policyRegister[policiesArray[k]].currentPolicyStatus ==
                PolicyStatus.Active &&
                policyRegister[policiesArray[k]].expiryDate > 0 &&
                now > policyRegister[policiesArray[k]].expiryDate
            ) {
                policyRegister[policiesArray[k]]
                    .currentPolicyStatus = PolicyStatus.Expired;
                liquidityManagement.removeLiability(
                    policyRegister[policiesArray[k]].payout
                );
                emit PolicyExpired(now, policiesArray[k]);
            }
            // 30 days grace period for premium payments
            if (
                policyRegister[policiesArray[k]].currentPolicyStatus ==
                PolicyStatus.Active &&
                policyRegister[policiesArray[k]].selectedPaymentOption ==
                PaymentOptions.Monthly &&
                policyRegister[policiesArray[k]].lastPaymentDate > 0 &&
                now >
                policyRegister[policiesArray[k]]
                    .lastPaymentDate
                    .add(30 days)
                    .add(30 days)
            ) {
                policyRegister[policiesArray[k]]
                    .currentPolicyStatus = PolicyStatus.Delinquent;
                liquidityManagement.removeLiability(
                    policyRegister[policiesArray[k]].payout
                );
                emit PolicyDelinquent(now, policiesArray[k]);
            }
            if (
                policyRegister[policiesArray[k]].currentPolicyStatus ==
                PolicyStatus.Active &&
                policyRegister[policiesArray[k]].selectedPaymentOption ==
                PaymentOptions.Yearly &&
                policyRegister[policiesArray[k]].lastPaymentDate > 0 &&
                now >
                policyRegister[policiesArray[k]]
                    .lastPaymentDate
                    .add(365 days)
                    .add(30 days)
            ) {
                policyRegister[policiesArray[k]]
                    .currentPolicyStatus = PolicyStatus.Delinquent;
                liquidityManagement.removeLiability(
                    policyRegister[policiesArray[k]].payout
                );
                emit PolicyDelinquent(now, policiesArray[k]);
            }
        }
    }

    function _withdrawPayoutShare(bytes32 _policyIDhash, address _beneficiary)
        private
    {
        uint256 beneficiaryPayout =
            policyRegister[_policyIDhash]
                .payout
                .mul(
                policyRegister[_policyIDhash].beneficiariesShare[_beneficiary]
            )
                .div(100);

        liquidityManagement.withdrawLiquidityViaPayout(
            _beneficiary,
            beneficiaryPayout
        );

        policyRegister[_policyIDhash].beneficiaries[_beneficiary] = 3; // 3 stands for "compensated"
        policyRegister[_policyIDhash].remainingPayout = policyRegister[
            _policyIDhash
        ]
            .remainingPayout
            .sub(beneficiaryPayout);
        emit BeneficiaryPayoutWithdrawn(
            now,
            _policyIDhash,
            _beneficiary,
            beneficiaryPayout
        );

        if (policyRegister[_policyIDhash].remainingPayout == 0) {
            policyRegister[_policyIDhash].currentPolicyStatus = PolicyStatus
                .PaidOut;
            emit PolicyFullyPaidOut(now, _policyIDhash);
        }
    }
}
