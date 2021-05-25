pragma solidity >=0.4.21 <0.7.0;

import "./ContractRegistry.sol";
import "./PolicyManagement.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ClaimsManagement is ChainlinkClient {
    // interfaces & contract instantiations

    ContractRegistry public contractRegistry;
    PolicyManagement public policyManagement;
    IERC20 public LINKtoken;

    // events

    event ContractRegistryInitiated(address _contractRegistryAddress);

    event FailedOracleCall(uint256 date, bytes32 _policyIDhash);
    event OracleCallSent(uint256 date, bytes32 _policyIDhash, string _APIcall);
    event OracleAnswerReceived(
        uint256 date,
        bytes32 _requestID,
        string _result
    );

    // contract variables in storage

    address public contractOwner;
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    mapping(bytes32 => bytes32) public requestIDregister;
    string public lastOracleResult; // for debugging

    // modifiers

    modifier onlyOwner() {
        require(
            msg.sender == contractOwner,
            "Only the contract owner can call this function"
        );
        _;
    }

    // constructor function

    constructor() public {
        contractOwner = msg.sender;
        setChainlinkToken(0xb0897686c545045aFc77CF20eC7A532E3120E0F1);
        LINKtoken = IERC20(0xb0897686c545045aFc77CF20eC7A532E3120E0F1);
        /*
        // tesnet parameters
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        oracle = 0xc8D925525CA8759812d0c299B90247917d4d4b7C;
        jobId = "a7330d0b4b964c05abc66a26307047c0";
        fee = 10**16;
        */
    }

    // oracle functions

    function getOracleConfirmation(
        bytes32 _policyIDhash,
        string calldata _KYCidentifier
    ) public {
        require(
            msg.sender == contractRegistry.policyManagementContract(),
            "Only the policy management contract can call this function"
        );

        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.__callback.selector
            );
        // Set the URL to perform the GET request on
        string memory s1 =
            "https://firestore.googleapis.com/v1/projects/cherishdb-10aa5/databases/(default)/documents/RNIPP/";
        string memory s2 = _KYCidentifier;
        string memory APIcall = string(abi.encodePacked(s1, s2));
        request.add("get", APIcall);
        // Set the path to find the desired data in the API response, where the response format is:
        request.add("path", "fields.status.stringValue");
        bytes32 _requestId = sendChainlinkRequestTo(oracle, request, fee);
        requestIDregister[_requestId] = _policyIDhash;
    }

    function __callback(bytes32 _requestId, bytes32 _result)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit OracleAnswerReceived(now, _requestId, bytes32ToString(_result));

        // to delete
        lastOracleResult = bytes32ToString(_result);

        bytes32 _policyIDhash = requestIDregister[_requestId];
        policyManagement.finalizeClaim(bytes32ToString(_result), _policyIDhash);
        delete requestIDregister[_requestId];
    }

    // owner functions

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

    function setOracleParameters(uint256 _oracleProvider) public onlyOwner {
        if (_oracleProvider == 1) {
            // Matrixed.link
            oracle = 0x0a31078cD57d23bf9e8e8F1BA78356ca2090569E;
            jobId = "f2ca823b55384a878c4f3fdba9102fa0";
            fee = 10**16;
        } else if (_oracleProvider == 2) {
            // LinkRiver
            setChainlinkToken(0xb0897686c545045aFc77CF20eC7A532E3120E0F1);
            oracle = 0xc8D925525CA8759812d0c299B90247917d4d4b7C;
            jobId = "f0da6c15faf54a3187ac63001f0dab1e";
            fee = 10**17;
        }
    }

    function withdrawLINK() public onlyOwner {
        uint256 LINKbalance = LINKtoken.balanceOf(address(this));
        LINKtoken.transfer(msg.sender, LINKbalance);
    }

    // private functions

    function _setContractRegistryAndAddresses(address _contractRegistry)
        private
    {
        contractRegistry = ContractRegistry(_contractRegistry);
        policyManagement = PolicyManagement(
            contractRegistry.policyManagementContract()
        );
        emit ContractRegistryInitiated(_contractRegistry);
    }

    // utils

    function bytes32ToString(bytes32 _bytes32)
        public
        pure
        returns (string memory)
    {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
