import React, {useState, useEffect} from "react";

import spinner from "../spinner.png";
import { abi as PolicyManagementABI } from "../contracts/PolicyManagement.json";
import { abi as LiquidityManagementABI } from "../contracts/LiquidityManagement.json";
import { abi as InvestmentManagementABI } from "../contracts/InvestmentManagement.json";


import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
};

const web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
  providerOptions // required
});

const Dashboard = (props) => {

    const [ethereumWallet, setEthereumWallet] = useState("");
    const [web3, setWeb3] = useState({});

    const [policyContract, setPolicyContract] = useState({});
    const [liquidityContract, setLiquidityContract] = useState({});
    const [investmentContract, setInvestmentContract] = useState({});

    const [totalLiabilities, setTotalLiabilities] = useState(0);
    const [minimumCapitalReserve, setMinimumCapitalReserve] = useState(0);
    const [currentLiquidityReserves, setCurrentLiquidityReserves] = useState(0);
    const [investedFunds, setInvestedFunds] = useState(0);
    const [totalAvailableReserves, setTotalAvailableReserves] = useState(0);

    const [policiesArray, setPoliciesArray] = useState([]);
    const [policiesInfoArray, setPoliciesInfoArray] = useState([]);

    const [policyIDhash, setPolicyIDhash] = useState("");
    const [policyParameters, setPolicyParameters] = useState({});
    const [policyFinancials, setPolicyFinancials] = useState({});
    const [policyBeneficiariesInfo, setPolicyBeneficiariesInfo] = useState([]);
    const [policiesElementsArray, setPoliciesElementsArray] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [activeTab, setActiveTab] = useState(0)

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

    const convertUnixDateIntoString = (unixDate) => {

          let dd = unixDate.getDate();
          let mm = unixDate.getMonth() + 1; //As January is 0.
          let yyyy = unixDate.getFullYear();
  
          if (dd < 10) dd = "0" + dd;
          if (mm < 10) mm = "0" + mm;
  
          return `${dd}/${mm}/${yyyy}`; 
      }

    const activateTab = async (e) => {
        setActiveTab(parseInt(e.target.id));
    }

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

        // instantiating the Liquidity Contract object
        //const liquidityContractAddress = window.prompt("Please enter the address of the Liquidity Management contract"); // testing purpose only
        const liquidityContractAddress = "0xf635711CB67FA833032e0e4D210E35cd52bA4Ce2";
        const liquidityContract = new web3.eth.Contract(LiquidityManagementABI, liquidityContractAddress);
        setLiquidityContract(liquidityContract);

        // instantiating the Investment Contract object
        //const investmentContractAddress = window.prompt("Please enter the address of the Investment Management contract"); // testing purpose only
        const investmentContractAddress = "0xc0641F4C8bA223b7CCAfa21B69bc2e8ADEB8C960"; // testing purpose only
        const investmentContract = new web3.eth.Contract(InvestmentManagementABI, investmentContractAddress);
        setInvestmentContract(investmentContract);
        
        // fetching user account
        const accounts = await web3.eth.getAccounts();
        setEthereumWallet(accounts[0]);

        // get systemwide financials

        let totalLiabilities = await liquidityContract.methods.totalLiabilities().call({ from: accounts[0] });
        setTotalLiabilities(parseFloat(web3.utils.fromWei(totalLiabilities)).toFixed(2));
        let minimumCapitalReserve = await liquidityContract.methods.minimumCapitalReserve().call({ from: accounts[0] });
        setMinimumCapitalReserve(parseFloat(web3.utils.fromWei(minimumCapitalReserve)).toFixed(2));
        let currentLiquidityReservesCall = await liquidityContract.methods.currentLiquidityReserves().call({ from: accounts[0] });
        setCurrentLiquidityReserves(parseFloat(web3.utils.fromWei(currentLiquidityReservesCall)).toFixed(2));

        let investedFundsCall = await investmentContract.methods.getInvestedFunds().call({ from: accounts[0] });
        setInvestedFunds(parseFloat(web3.utils.fromWei(investedFundsCall)).toFixed(2));
        let totalAvailableReservesSum = parseFloat(web3.utils.fromWei(currentLiquidityReservesCall)) + parseFloat(web3.utils.fromWei(investedFundsCall));
        setTotalAvailableReserves(totalAvailableReservesSum.toFixed(2));

        // get information on all recorded polices

        let policiesArrayCall = await policyContract.methods.getPoliciesArray().call({ from: accounts[0] });
        setPoliciesArray(policiesArrayCall);

        // loop inside the array to extract all information to display

        let policiesParametersArrayCall = await Promise.all(policiesArrayCall.map((el) => 
          policyContract.methods.getPolicyParameters(el).call({ from: accounts[0] })
        ));
        
        let policiesFinancialsArrayCall = await Promise.all(policiesArrayCall.map((el) => 
          policyContract.methods.getPolicyFinancials(el).call({ from: accounts[0] })
        ));

        let policiesBeneficiariesArrayCall = await Promise.all(policiesArrayCall.map((el) =>
          policyContract.methods.getPolicyBeneficiariesArray(el).call({ from: accounts[0] })
        ));       

        let policiesBeneficiariesInfoArrayCall = policiesArrayCall.map(async (el, index) => 
          await Promise.all(policiesBeneficiariesArrayCall[index].map(beneficiary => policyContract.methods.getBeneficiaryInfo(el, beneficiary).call({ from: accounts[0] }))     
       ));


        policiesBeneficiariesInfoArrayCall = await Promise.all(policiesBeneficiariesInfoArrayCall.map(el => el.then(
          function(value) {return value;},
          function(error) {console.log(error);}
        )));

        // policiesBeneficiariesInfoArrayCall = policiesBeneficiariesInfoArrayCall.map(el => el[0] ? el.map(elem => {return {beneficiaryStatus: elem[0], beneficiaryShare: elem[1]}}) : []);

        let policiesInfoArrayCall = policiesArrayCall.map((el, index) => {
           return {
            policyParameters: policiesParametersArrayCall[index],
            policyFinancials: policiesFinancialsArrayCall[index],
            beneficiaries: policiesBeneficiariesArrayCall[index],
            beneficiaryInfo: policiesBeneficiariesInfoArrayCall[index]
          }
        });
        setPoliciesInfoArray(policiesInfoArrayCall);

        setIsFetchingData(false);
    }

    useEffect(() => {
      onConnectAndFetchPoliciesData();
      }, []);

  return (
    <div className="dashboard">
      <div style={{ height: "60px" }}></div>
      <div className="title">
        <h1 style={{ fontWeight: "700" }}>System Dashboard</h1>
        <p style={{ fontStyle: "italic" }}>
        This page is dedicated to showing the live and transparent financial data of the Cherish platform. 
        <br/>
        <br/>
      Please connect your Ethereum wallet to read the latest system data.
      </p>
      </div>
    <div style={{ height: "20px" }}></div>
        <div className="beneficiary" style={{textAlign:"left", marginLeft: "20%"}}>
            <h3>Ethereum Wallet : {ethereumWallet.length > 0 ? ethereumWallet : ""}</h3>
        </div>
      <div className="section2">
        <div className="textbox">
            <h3>Cherish Policies By Current Status :</h3>
            <div>
            <ol className="tabs-list" style={{display: "flex",justifyContent: "space-between"}}>
            {policyEnumArray.map((el, index) => <li style={{display: "inline-block",
  listStyle: "none", padding: "0.5rem 0.75rem", border: "1px solid black", cursor: "pointer"}} className={activeTab === index ? "active" : ""} id={index} key={index} onClick={activateTab}>
                    {el}
                </li>)}
            </ol>
            <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
        </div>
        {isFetchingData ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "80px", width: "80px", marginBottom: "0.5rem"}}></img></div> : 
        <div>
          <div>{activeTab === 0 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "0").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 1 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "1").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem} (Status : ${el.beneficiaryInfo[index].beneficiaryStatus === "2" ? "Confirmed" : "Not Confirmed"})`}</i></p>))}
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 2 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "2").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem} (Status : ${el.beneficiaryInfo[index].beneficiaryStatus === "2" ? "Confirmed" : "Not Confirmed"})`}</i></p>))}
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 3 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "3").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem}`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
          <p>Policy Expiry Date : <i>{convertUnixDateIntoString(new Date(el.policyParameters.expiryDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 4 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "4").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem}`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
          <p>Policy Expiry Date : <i>{convertUnixDateIntoString(new Date(el.policyParameters.expiryDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 5 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "5").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>{`$${web3.utils.fromWei(el.policyFinancials.payout)}.00 (of which $${parseFloat(web3.utils.fromWei(el.policyFinancials.payout) - web3.utils.fromWei(el.policyFinancials.remainingPayout)).toFixed(2)} already paid out)`}</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem} (Status : ${el.beneficiaryInfo[index].beneficiaryStatus === "3" ? "Compensated" : "Not Yet Compensated"})`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
          <p>Policy Expiry Date : <i>{convertUnixDateIntoString(new Date(el.policyParameters.expiryDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 6 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "6").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>{`$${web3.utils.fromWei(el.policyFinancials.payout)}.00 (fully paid out)`}</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem} (Status : ${el.beneficiaryInfo[index].beneficiaryStatus === "3" ? "Compensated" : "Not Yet Compensated"})`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
          <p>Policy Expiry Date : <i>{convertUnixDateIntoString(new Date(el.policyParameters.expiryDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 7 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "7").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem}`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 8 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "8").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem}`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}
          </div>
        <div>{activeTab === 9 ? 
        policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "9").map((el, index) => 
        
        (<div key={index}>
         <h4> Policy n°{el.policyParameters.policyID}</h4>
         <p> Policy Owner : <i>{el.policyParameters.policyholder}</i> </p>
         <p> Policy Status : <i>{policyEnumArray[parseInt(el.policyParameters.currentPolicyStatus)]}</i> </p>
         <p> Policy KYC identifier : <i>{el.policyParameters.KYCidentifier.length > 0 ? el.policyParameters.KYCidentifier : "KYC not confirmed yet"}</i> </p>
         <p> Policy Payout : <i>${web3.utils.fromWei(el.policyFinancials.payout)}.00</i> </p>
         <p> Selected Payment Option : <i>{el.policyFinancials.selectedPaymentOption === "0" ? "Monthly" : "Yearly"}</i> </p>
         <p> Policy Premium : <i>${parseFloat(web3.utils.fromWei(el.policyFinancials.premiumAmount)).toFixed(2)}</i> </p>
         {el.beneficiaries.map((elem, index) => (<p key={index}>{`Beneficiary ${index+1} (${el.beneficiaryInfo[index].beneficiaryShare}% of payout) :`} <i>{`${elem}`}</i></p>))}
          <p>Last Payment Date : <i>{convertUnixDateIntoString(new Date(el.policyFinancials.lastPaymentDate * 1000))}</i></p>
           <div style={{marginTop: "1rem", marginBottom: "0.5rem", borderStyle: "double"}}></div>
       </div>))
        : null}</div>
      </div>}
    </div>
    <div className="textbox" style={{marginTop: "1rem"}}>
      <h3>Systemwide Financials of the Cherish Platform :</h3>
        {isFetchingData ? <div style={{display: "flex", justifyContent: "center"}}><img alt="spinner" src={spinner} style={{height: "80px", width: "80px", marginBottom: "1rem"}}></img></div> : 
        <div>
          <p>Active Policies : <i>{policiesInfoArray.filter(elem => elem.policyParameters.currentPolicyStatus === "3").length}</i></p>
          <p>Total Liabilities : <i>${totalLiabilities}</i></p>
          <p>Minimum Capital Reserve : <i>${minimumCapitalReserve}</i></p>
          <p>Current Liquidity Reserves : <i>${currentLiquidityReserves}</i></p>
          <p>Invested Funds : <i>${investedFunds}</i></p>
          <p>Total Available Reserves : <i>${totalAvailableReserves}</i></p>
        </div>}
      </div>
  </div>
  </div>
  );
};

export default Dashboard;
