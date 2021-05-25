import React, {useState, useEffect} from "react";

import spinner from "../spinner.png";
import { abi as PolicyManagementABI } from "../contracts/PolicyManagement.json";

import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
};

const web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
  providerOptions // required
});

const Claim = (props) => {

    const [ethereumWallet, setEthereumWallet] = useState("");
    const [web3, setWeb3] = useState({});

    const [policyContract, setPolicyContract] = useState({});
    const [policiesArray, setPoliciesArray] = useState([]);
    const [policiesInfoArray, setPoliciesInfoArray] = useState([]);

    const [policyIDhash, setPolicyIDhash] = useState("");
    const [policyParameters, setPolicyParameters] = useState({});
    const [policyFinancials, setPolicyFinancials] = useState({});
    const [policyBeneficiariesInfo, setPolicyBeneficiariesInfo] = useState([]);
    const [policiesElementsArray, setPoliciesElementsArray] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);

    const policyEnumArray = ["Quoted",
        "Allocated",
        "Confirmed",
        "Active",
        "ClaimStarted",
        "ClaimConfirmedByOracle",
        "PaidOut",
        "Delinquent",
        "Cancelled",
        "Expired"]

    const onConnectAndFetchPoliciesData = async() => {
        // instantiating the web3 object
        const provider = await web3Modal.connect();
        const web3 = new Web3(provider);
        setWeb3(web3);

        // instantiating the Policy Contract object
        //const policyContractAddress = window.prompt("Please enter the address of the Policy Management contract"); // testing purpose only
        const policyContractAddress = "0x8571Cc61e6cd98502798379d445faF6DeA7395a4";
        const policyContract = new web3.eth.Contract(PolicyManagementABI, policyContractAddress);
        setPolicyContract(policyContract);
        
        // fetching user account
        const accounts = await web3.eth.getAccounts();
        setEthereumWallet(accounts[0]);

        let policiesArrayCall = await policyContract.methods.getBeneficiaryPoliciesArray(accounts[0]).call({ from: accounts[0] });
        setPoliciesArray(policiesArrayCall);

        let policiesParametersArrayCall = await Promise.all(policiesArrayCall.map((el) => 
          policyContract.methods.getPolicyParameters(el).call({ from: accounts[0] })
        ));
        
        let policiesFinancialsArrayCall = await Promise.all(policiesArrayCall.map((el) => 
          policyContract.methods.getPolicyFinancials(el).call({ from: accounts[0] })
        ));

        let policiesbeneficiaryInfoArrayCall = await Promise.all(policiesArrayCall.map((el) => 
          policyContract.methods.getBeneficiaryInfo(el, (accounts[0])).call({ from: accounts[0] })
        ));

        let policiesInfoArrayCall = policiesArrayCall.map((el, index) => {
           return {
            policyParameters: policiesParametersArrayCall[index],
            policyFinancials: policiesFinancialsArrayCall[index],
            beneficiaryInfo: policiesbeneficiaryInfoArrayCall[index]
          }
        });
        setPoliciesInfoArray(policiesInfoArrayCall);

        const onStartClaim = async(e) => {
          e.preventDefault();
          e.persist();
          setIsLoading(true);
          await policyContract.methods.startClaim(policiesArrayCall[e.target.id]).send({from: accounts[0]});
          window.alert(`You have started a claim for policy n° ${policiesInfoArrayCall[e.target.id].policyParameters.policyID}. The oracle will verify the validity of the claim and update the policy's status.`);
          setIsLoading(false);
        }
    
        const onWithdrawPayoutShare = async(e) => {
          e.preventDefault();
          e.persist();
          setIsLoading(true);
          await policyContract.methods.withdrawPayoutShare(policiesArrayCall[e.target.id]).send({from: accounts[0]});
          window.alert(`Your share of the payout for policy n° ${policiesInfoArrayCall[e.target.id].policyParameters.policyID} has been successfully sent to your Ethereum wallet. You will now be taken to the homepage.`);
          setIsLoading(false);
          props.history.push("/");
        }

        let policiesElementsArray = policiesInfoArrayCall.map((el, index) => 
        
         (<div key={index}>
          <h4> Policy n°{el.policyParameters.policyID}</h4>
          <p> Policy Owner : {el.policyParameters.policyholder} </p>
          <p> Policy Status : {policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]} </p>
          <p> Policy KYC identifier : {el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"} </p>
          <p> Your share of Policy Payout : ${Math.floor(web3.utils.fromWei(el.policyFinancials.payout) * el.beneficiaryInfo.beneficiaryShare / 100)}.00 </p>
          {el.policyParameters.currentPolicyStatus === "3" ? <button
            style={{
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "1rem"
            }}
            id={index}
            onClick={onStartClaim}
          >
            Start Claim on this Policy
          </button> : null}
          {el.policyParameters.currentPolicyStatus === "5" && el.beneficiaryInfo.beneficiaryStatus !== "3"  ? <button
            style={{
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "1rem"
            }}
            id={index}
            onClick={onWithdrawPayoutShare}
          >
            Withdraw Payout on this Policy
          </button> : null}
          {el.policyParameters.currentPolicyStatus !== "3" && el.policyParameters.currentPolicyStatus !== "5" ? <p style={{fontWeight: "bold"}}>
            This Policy is not at Active stage and may not be the object of a claim.
          </p> : null}
          {el.policyParameters.currentPolicyStatus === "5" && el.beneficiaryInfo.beneficiaryStatus === "3" ? <p style={{fontWeight: "bold"}}>
            You have already withdrawn the payout of this Policy.
          </p> : null}
          {isLoading === true ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "100px", width: "100px", marginBottom: "10px"}}></img></div> : null}
            <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
        </div>));
        setPoliciesElementsArray(policiesElementsArray);

        // subscribe to events related to oracle calls and inform user on results

        policyContract.once('ClaimConfirmed', {
          filter: {_policyIDhash: policiesArrayCall}, 
          fromBlock: 0
      } , function(error, event){ window.alert("The oracle verification has come back as positive and your claim has been verified. Refresh the page in order to start the payout withdrawing process.") });
        policyContract.once('ClaimRejected', {
          filter: {_policyIDhash: policiesArrayCall}, 
          fromBlock: 0
      }, function(error, event){ window.alert("The oracle verification has come back as negative and your claim has been rejected. Please get in touch with our support team.") });

      setIsFetchingData(false);

    }

    useEffect(() => {
      onConnectAndFetchPoliciesData();
      }, []);    
    
  return (
    <div className="claim">
      <div style={{ height: "60px" }}></div>
      <div className="title">
        <h1 style={{ fontWeight: "700" }}>Policy Claims</h1>
        <p style={{ fontStyle: "italic" }}>
        Welcome to the Cherish platform ! This is where you can begin the claim procedure for policies where you are a beneficiary.
        <br/>
        <br/>
      Please connect your Ethereum wallet to access the information of the policies at your name.
      </p>
      </div>
    <div style={{ height: "20px" }}></div>
        <div className="beneficiary" style={{textAlign:"left", marginLeft: "20%"}}>
            <h3>Beneficiary Wallet : {ethereumWallet.length > 0 ? ethereumWallet : ""}</h3>
        </div>
      <div className="section">
        <div className="textbox">
        <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
          {isFetchingData ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "80px", width: "80px", marginBottom: "0.5rem"}}></img></div> : <div>{policiesElementsArray.length > 0 ? policiesElementsArray : <p>There are currently no policies in the system in which your address has been nominated as a beneficiary.</p>}</div>}
      </div>
    </div>
  </div>
  );
};

export default Claim;
