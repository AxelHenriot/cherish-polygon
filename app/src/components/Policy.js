import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";

import spinner from "../spinner.png";
import { abi as PolicyManagementABI } from "../contracts/PolicyManagement.json";
import { abi as FakeDaiABI } from "../contracts/FakeDai.json";

import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
};

const web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
  providerOptions // required
});

const Policy = (props) => {

    const [policyOwnerWallet, setPolicyOwnerWallet] = useState("");
    const [web3, setWeb3] = useState({});

    const [policyContract, setPolicyContract] = useState({});
    const [liquidityContractAddress, setLiquidityContractAddress] = useState("");
    const [paymentTokenContract, setPaymentTokenContract] = useState({});

    const [policyIDhash, setPolicyIDhash] = useState("");
    const [policyParameters, setPolicyParameters] = useState({});
    const [policyFinancials, setPolicyFinancials] = useState({});
    const [policyBeneficiariesInfo, setPolicyBeneficiariesInfo] = useState([]);

    const [lastPaymentDateString, setLastPaymentDateString] = useState("");
    const [expiryDateString, setExpiryDateString] = useState("");
    const [paymentDueDateString, setPaymentDueDateString] = useState("");
    const [isDueForPayment, setIsDueForPayment] = useState(false);
    
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

    // test functions

    const onChangePolicyStatus = async(e) => {
        e.preventDefault();
        let policyStatusNumber = window.prompt("Enter policy status to apply");
        await policyContract.methods.changePolicyStatus(policyIDhash, policyStatusNumber).send({from: policyOwnerWallet});
    }

    const onModifyLastPaymentDate = async(e) => {
        e.preventDefault();
        let daysAdded = window.prompt("Enter number of days to add");
        await policyContract.methods.modifyLastPaymentDate(policyIDhash, true, daysAdded).send({from: policyOwnerWallet});
    }

    const onConfirmKYC = async(e) => {
        e.preventDefault();
        let KYCidentifier = window.prompt("Enter KYC identifier");
        await policyContract.methods.confirmKYC(policyIDhash, KYCidentifier).send({from: policyOwnerWallet});
    }

    const convertUnixDateIntoString = (unixDate) => {

        let dd = unixDate.getDate();
        let mm = unixDate.getMonth() + 1; //As January is 0.
        let yyyy = unixDate.getFullYear();

        if (dd < 10) dd = "0" + dd;
        if (mm < 10) mm = "0" + mm;

        return `${dd}/${mm}/${yyyy}`; 
    }

    const onConnectAndFetchPolicyData = async() => {
        // instantiating the web3 object
        const provider = await web3Modal.connect();
        const web3 = new Web3(provider);
        setWeb3(web3);

        // instantiating the Policy Contract object
        // const policyContractAddress = window.prompt("Please enter the address of the Policy Management contract"); // testing purpose only
        const policyContractAddress = "0x8571Cc61e6cd98502798379d445faF6DeA7395a4";
        const policyContract = new web3.eth.Contract(PolicyManagementABI, policyContractAddress);
        setPolicyContract(policyContract);
        
        // getting and saving the Liquidity Management contract address
        // const liquidityContractAddress = window.prompt("Please enter the address of the Liquidity Management contract"); // testing purpose only
        const liquidityContractAddress = "0xf635711CB67FA833032e0e4D210E35cd52bA4Ce2";
        setLiquidityContractAddress(liquidityContractAddress);

        // getting and saving the Payment Token contract address
        // const paymentContractAddress = window.prompt("Please enter the address of the Payment Token contract"); // testing purpose only
        const paymentContractAddress = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
        const paymentTokenContract = new web3.eth.Contract(FakeDaiABI, paymentContractAddress);
        setPaymentTokenContract(paymentTokenContract);
        
        // fetching user account
        const accounts = await web3.eth.getAccounts();
        setPolicyOwnerWallet(accounts[0]);

        let policyIDhashCall = await policyContract.methods.ownerRegister(accounts[0]).call({ from: accounts[0] });
        setPolicyIDhash(policyIDhashCall);

        let policyParametersCall = await policyContract.methods.getPolicyParameters(policyIDhashCall).call({ from: accounts[0] });
        setPolicyParameters(policyParametersCall);
        let policyFinancialsCall = await policyContract.methods.getPolicyFinancials(policyIDhashCall).call({ from: accounts[0] });
        policyFinancialsCall.payout = web3.utils.fromWei(policyFinancialsCall.payout);
        policyFinancialsCall.remainingPayout = web3.utils.fromWei(policyFinancialsCall.remainingPayout);
        policyFinancialsCall.premiumAmount = web3.utils.fromWei(policyFinancialsCall.premiumAmount);
        setPolicyFinancials(policyFinancialsCall);

        let beneficiariesAddressArray = await policyContract.methods.getPolicyBeneficiariesArray(policyIDhashCall).call({ from: accounts[0] });
        let beneficiariesInfoArray = await Promise.all(beneficiariesAddressArray.map((el) => 
             policyContract.methods.getBeneficiaryInfo(policyIDhashCall, el).call({ from: accounts[0] })
        ));
        let policyBeneficiariesInfoArray = beneficiariesAddressArray.map((el, index) => [el, beneficiariesInfoArray[index].beneficiaryStatus, beneficiariesInfoArray[index].beneficiaryShare]);
        setPolicyBeneficiariesInfo(policyBeneficiariesInfoArray);

        // create human-readable format for lastPaymentDate and expiryDate

        let lastPaymentDateObject = new Date(policyFinancialsCall.lastPaymentDate * 1000);
        let lastPaymentDateString = convertUnixDateIntoString(lastPaymentDateObject);
        setLastPaymentDateString(lastPaymentDateString);

        let expiryDateObject = new Date(policyParametersCall.expiryDate * 1000);
        let expiryDateString = convertUnixDateIntoString(expiryDateObject);
        setExpiryDateString(expiryDateString);

        // get lastPaymentDate and add payment terms to get next payment date
        if (policyParametersCall.currentPolicyStatus === "3") {

            let paymentDueDate;
            if (policyFinancialsCall.selectedPaymentOption === "0") {
                paymentDueDate = new Date(policyFinancialsCall.lastPaymentDate * 1000 + 30*24*60*60 * 1000);

                let paymentDueDateString = convertUnixDateIntoString(paymentDueDate);

                setPaymentDueDateString(paymentDueDateString);
            } else {
                paymentDueDate = new Date(policyFinancialsCall.lastPaymentDate * 1000 + 365*24*60*60 * 1000);

                let paymentDueDateString = convertUnixDateIntoString(paymentDueDate);

                setPaymentDueDateString(paymentDueDateString);
            }

            if ((new Date()).getTime() > paymentDueDate) {
                setIsDueForPayment(true);
            }
        }

        setIsFetchingData(false);
    }

    useEffect(() => {
        onConnectAndFetchPolicyData();
      }, []);

    const onFirstPaymentAndActivation = async(e) => {
       e.preventDefault();
       setIsLoading(true);
       console.log(policyFinancials.premiumAmount);
       console.log(web3.utils.toWei(policyFinancials.premiumAmount));
       await paymentTokenContract.methods.approve(liquidityContractAddress, web3.utils.toWei(policyFinancials.premiumAmount)).send({from: policyOwnerWallet});
       try {
        await policyContract.methods.firstPaymentAndActivation(policyIDhash).send({from: policyOwnerWallet});
       } catch(err) {
           console.log(err);
       }
       window.alert(`You have paid the initial premium and activated policy n° ${policyParameters.policyID}. You can keep track of your policy on this page.`);
       setIsLoading(false);
    }

    const onPayPremium = async(e) => {
        e.preventDefault();
        setIsLoading(true);
        await paymentTokenContract.methods.approve(liquidityContractAddress, web3.utils.toWei(policyFinancials.premiumAmount)).send({from: policyOwnerWallet});
        await policyContract.methods.payPremium(policyIDhash).send({from: policyOwnerWallet});
        window.alert(`You have paid the due premium for your policy n° ${policyParameters.policyID}. You can keep track of your policy on this page.`);
        setIsLoading(false);
     }

    const onCancelPolicy = async(e) => {
        e.preventDefault();
        const userConfirmation = window.prompt("Are you certain you want to cancel your Cherish life insurance policy ? Enter YES in the field below to confirm.");
        if (userConfirmation === "YES") {
            setIsLoading(true);
            await policyContract.methods.cancelPolicy(policyIDhash).send({from: policyOwnerWallet});
            window.alert(`You have correctly cancelled your policy n° ${policyParameters.policyID}. You will now be taken to the homepage.`);
            setIsLoading(false);
            props.history.push("/");
        }
    }

  return (
    <div className="policy">
      <div style={{ height: "60px" }}></div>
      <div className="title">
        <h1 style={{ fontWeight: "700" }}>Policy Summary</h1>
      </div>
      {policyOwnerWallet === "0x0C3f4185AaecD498cfd51B3d683C2C46d301b2F7" ? <div>
      <button
            style={{
              marginBottom: "4rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onChangePolicyStatus}
          >
            Change Policy Status  
          </button>
          <button
            style={{
              marginBottom: "4rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onConfirmKYC}
          >
            Confirm KYC  
          </button>
          <button
            style={{
              marginBottom: "4rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onModifyLastPaymentDate}
          >
            Modify Last Payment Date  
          </button>
    </div> : null}
      <div className="section">
        <div className="textbox">
          <h3>Policy Parameters</h3>
          {isFetchingData ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "80px", width: "80px", marginBottom: "0.5rem"}}></img></div> : <div><p>
            Policy owner : <i>{policyOwnerWallet}</i>
          </p>
          <p>
            Policy ID : <i>{policyParameters.policyID}</i>
          </p>
          <p>
            Policy status : <i>{policyEnumArray[parseInt(policyParameters.currentPolicyStatus)]}</i>
          </p>
          <p>
            Policy KYC identifier : <i>{policyParameters.KYCidentifier === "" ? "KYC not yet confirmed" : policyParameters.KYCidentifier}</i>
          </p>
          <p>
              Policy duration : <i>5 years</i>
            </p>
            <p>
            Policy expiry date : <i>{policyParameters.expiryDate === "0" ? "N/A" : expiryDateString}</i>
          </p></div>}
          <h3>Policy Financials</h3>
          {isFetchingData ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "80px", width: "80px", marginBottom: "0.5rem"}}></img></div> : <div><p>
            Payment option : <i>{policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i>
          </p>
          <p>
            Policy premium : <i>${`${parseFloat(policyFinancials.premiumAmount).toFixed(2)} per ${policyFinancials.selectedPaymentOption === "0" ? "month" : "year"}`}</i>
          </p>
          <p>
            Policy total payout : <i>${parseFloat(policyFinancials.payout).toFixed(2)}</i>
          </p>
          <p>
            Remaining payout : <i>${parseFloat(policyFinancials.remainingPayout).toFixed(2)}</i>
          </p>
          <p>
            Last payment date : <i>{policyFinancials.lastPaymentDate === "0" ? "N/A" : lastPaymentDateString}</i>
          </p></div>}
            <h3>Beneficiaries</h3>
          {isFetchingData ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "80px", width: "80px", marginBottom: "0.5rem"}}></img></div> : policyBeneficiariesInfo.map((beneficiary, index) => (
              <div key={index}>
              <p style={{fontWeight: "bold" }}>Beneficiary {index + 1}</p>
              <p>Ethereum wallet : <i>{beneficiary[0]}</i></p>
              <p>Beneficiary status : <i>{beneficiary[1] === "1" ? "Not yet confirmed" : "Confirmed"}</i></p>
              <p>Payout share : <i>{beneficiary[2]}%</i></p>
              </div>
          ))}
          
          {policyBeneficiariesInfo.findIndex(beneficiary => beneficiary[1] === "1") !== -1 ?  
          <div style={{marginBottom: "20px"}}>
          <p style={{ fontWeight: "bold" }}>At least one beneficiary of your life insurance policy has not yet confirm their role as recipient. You can send them the following link where they will be able to sign their confirmation :</p>
            <Link to={`/confirmation/${policyParameters.policyID}`}>Confirmation for Beneficiaries</Link>
            </div>
             : null
             }
        
        {policyParameters.currentPolicyStatus === "2" && policyParameters.KYCidentifier === "" ? <div>
          <p style={{ fontWeight: "bold" }}>Your Cherish Policy is currently pending the review of your KYC documents by our partner.
          </p>
            </div>
        : null}

            {policyParameters.currentPolicyStatus === "2" && policyParameters.KYCidentifier !== "" ? <div>
          <p style={{ fontWeight: "bold" }}>All beneficiaries of your life insurance policy have confirmed their role as recipients and your KYC documents have been verified. You can now pay the first premium and activate the policy :</p>
          <button
            style={{
              marginBottom: "2rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onFirstPaymentAndActivation}
          >
            Pay first policy premium and activate my Cherish Policy
          </button>
            </div>
             : null}
        
            {policyParameters.currentPolicyStatus === "3" && isDueForPayment === true ? <div>
          <p style={{ fontWeight: "bold" }}>Your Cherish Policy is active and a premium payment is due.
          <br/>
          <br/>
          Payment is due at the latest within 30 days after : {paymentDueDateString}. In the absence of payment after this period, your policy will be rendered void.
          </p>
          <div>
          <button
            style={{
              marginBottom: "2rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onPayPremium}
          >
            Pay due policy premium
          </button>
          <button
            style={{
              marginBottom: "2rem",
              marginLeft: "1rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onCancelPolicy}
          >
            Cancel my Cherish Policy
          </button>
          </div>
            </div>
        : null}

{policyParameters.currentPolicyStatus === "3" && isDueForPayment === false ? <div>
          <p style={{ fontWeight: "bold" }}>Your Cherish Policy is active and there is no pending payment.
          <br/>
          <br/>
          Next payment is expected on : {paymentDueDateString}
          </p>
          <div>
          <button
            style={{
              marginBottom: "2rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onCancelPolicy}
          >
            Cancel my Cherish Policy
          </button>
          </div>
            </div>
        : null}

{policyParameters.currentPolicyStatus === "4" ? <div>
          <p style={{ fontWeight: "bold" }}>Your Cherish Policy is currently the object of a claim and the oracle is verifying its validity.
          </p>
            </div>
        : null}
{policyParameters.currentPolicyStatus === "5" ? <div>
          <p style={{ fontWeight: "bold" }}>This Policy has been the object of claim that has been verified by the oracle. Beneficiaries can now claim their share of the policy's payout.
          </p>
            </div>
        : null}
{policyParameters.currentPolicyStatus === "6" ? <div>
          <p style={{ fontWeight: "bold" }}>This Policy has been claimed by its beneficiaries and paid out entirely.
          </p>
            </div>
        : null}
{policyParameters.currentPolicyStatus === "7" ? <div>
          <p style={{ fontWeight: "bold" }}>This Policy has become void due to missed premium payments.
          </p>
            </div>
        : null}
{policyParameters.currentPolicyStatus === "8" ? <div>
          <p style={{ fontWeight: "bold" }}>This Policy has been cancelled at the request of the policy owner.
          </p>
            </div>
        : null}
{policyParameters.currentPolicyStatus === "9" ? <div>
          <p style={{ fontWeight: "bold" }}>This Policy has expired and is no longer in force.
          </p>
            </div>
        : null}
        {isLoading === true ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "100px", width: "100px", marginBottom: "2rem"}}></img></div> : null}
        </div>
      </div>
    </div>
  );
};

export default Policy;
