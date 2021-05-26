import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from 'uuid';

import { saveOwnerData } from "../actions/quoteActions";
import { saveWeb3Data } from "../actions/web3Actions";
import { abi } from "../contracts/PolicyManagement.json";
import spinner from "../spinner.png";
 

// web3

import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
};

const web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
  providerOptions // required
});

const Quote = (props) => {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(0);
  const [sex, setSex] = useState("");
  const [isSmoker, setIsSmoker] = useState("");
  const [paymentOption, setPaymentOption] = useState("");
  const [payout, setPayout] = useState(0);

  const [quote, setQuote] = useState(0);

  const [isLoading, setIsLoading] = useState(false);


  const dispatch = useDispatch();
  const {web3, policyContract, policyOwnerWallet} = useSelector(state => state.web3Data);

   const onConnect = async(e) => {

    // instantiating the web3 object
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);
    // instantiating the Policy Contract object
    // const policyContractAddress = window.prompt("Please enter the address of the Policy Management contract"); // testing purpose only
    const policyContractAddress = "0x8571Cc61e6cd98502798379d445faF6DeA7395a4";
    const policyContract = new web3.eth.Contract(abi, policyContractAddress);
    // fetching user account
    const accounts = await web3.eth.getAccounts();
    let policyOwnerWallet = accounts[0];

    // saving web3 data in Redux
    dispatch(saveWeb3Data({web3, policyContract, policyOwnerWallet}));

  } 

  const onSubmitQuotationParameters = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const premiumAmount = await policyContract.methods.quote(age, isSmoker, paymentOption, web3.utils.toWei(payout)).call({ from: policyOwnerWallet });
    setQuote(web3.utils.fromWei(premiumAmount));
    setIsLoading(false);
  };

  const onConfirmQuote = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const ownerUUID = uuidv4();

    dispatch(
      saveOwnerData({
        firstName,
        lastName,
        email,
        age,
        sex,
        ownerUUID,
      })
    );

    await policyContract.methods.confirmQuote(ownerUUID, age, isSmoker, paymentOption, web3.utils.toWei(payout)).send({from: policyOwnerWallet});
    window.alert(`The quote parameters have been correctly entered into the system, you will know be taken to the KYC step.`);
    setIsLoading(false);
    props.history.push("/kyc");
  }

  useEffect(() => {
    onConnect();
  }, []);



  return (
    <div className="quote">
      <div style={{ height: "60px" }}></div>
      <h1>Quote Engine</h1>
      <p style={{ fontStyle: "italic" }}>
        Please connect your Ethereum wallet and fill in the information in the form below to receive your instant
        quote.
      </p>
      <div style={{ height: "20px" }}></div>
        <div className="policyOwner" style={{textAlign:"left", marginLeft: "20%"}}>
            <h3>Policy Owner Wallet : {policyOwnerWallet.length > 0 ? policyOwnerWallet : ""}</h3>
        </div>
      <div className="quotebox">
        <form onSubmit={onSubmitQuotationParameters}>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="firstName">First Name</label>
            </div>
            <div style={{ width: "200px", display: "inline-block" }}>
              <input
                type="text"
                className="form-control"
                name="firstName"
                minLength="2"
                required
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="lastName">Last Name</label>
            </div>
            <div style={{ width: "200px", display: "inline-block" }}>
              <input
                type="text"
                className="form-control"
                name="lastName"
                minLength="2"
                required
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="email">Email</label>
            </div>
            <div style={{ width: "200px", display: "inline-block" }}>
              <input
                type="email"
                className="form-control"
                name="email"
                required
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="age">Age</label>
            </div>
            <div style={{ width: "200px", display: "inline-block" }}>
              <input
                type="text"
                className="form-control"
                name="age"
                required
                onChange={(e) => setAge(e.target.value)}
                value={age}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="sex">Sex</label>
            </div>
            <div style={{ width: "100px", display: "inline-block" }}>
              <p style={{ display: "inline-block", margin: "0" }}>Male </p>
              <input
                type="checkbox"
                name="male"
                checked={sex === "Male"}
                onChange={() => setSex("Male")}
                style={{ display: "inline-block" }}
              />
            </div>
            <div style={{ width: "100px", display: "inline-block" }}>
              <p style={{ display: "inline-block", margin: "0" }}>Female </p>
              <input
                type="checkbox"
                name="female"
                checked={sex === "Female"}
                onChange={() => setSex("Female")}
                style={{ display: "inline-block" }}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="smoker">Do you smoke ?</label>
            </div>
            <div style={{ width: "100px", display: "inline-block" }}>
              <p style={{ display: "inline-block", margin: "0" }}>Yes </p>
              <input
                type="checkbox"
                name="yes"
                checked={isSmoker === true}
                onChange={() => setIsSmoker(true)}
                style={{ display: "inline-block" }}
              />
            </div>
            <div style={{ width: "100px", display: "inline-block" }}>
              <p style={{ display: "inline-block", margin: "0" }}>No </p>
              <input
                type="checkbox"
                name="no"
                checked={isSmoker === false}
                onChange={() => setIsSmoker(false)}
                style={{ display: "inline-block" }}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="paymentplan">Payment Plan</label>
            </div>
            <div style={{ width: "100px", display: "inline-block" }}>
              <p style={{ display: "inline-block", margin: "0" }}>Monthly </p>
              <input
                type="checkbox"
                name="monthly"
                checked={paymentOption === "monthly"}
                onChange={() => setPaymentOption("monthly")}
                style={{ display: "inline-block" }}
              />
            </div>
            <div style={{ width: "100px", display: "inline-block" }}>
              <p style={{ display: "inline-block", margin: "0" }}>Yearly </p>
              <input
                type="checkbox"
                name="yearly"
                checked={paymentOption === "yearly"}
                onChange={() => setPaymentOption("yearly")}
                style={{ display: "inline-block" }}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                width: "200px",
                display: "inline-block",
                textAlign: "left",
              }}
            >
              <label htmlFor="payout">Payout Amount (in USD)</label>
            </div>
            <div style={{ width: "200px", display: "inline-block" }}>
              <input
                type="text"
                className="form-control"
                name="payout"
                onChange={(e) => setPayout(e.target.value)}
                value={payout}
              />
            </div>
          </div>
            
          <input
            type="submit"
            value="Submit"
            className="btn btn-primary btn-block"
          />
        </form>
        <div>
      </div>
        {quote !== 0 ? (
          <div style={{ marginLeft: "20%", marginRight: "20%" }}>
            <p>
              The premium for your Life Insurance policy will be $
              {parseFloat(quote).toFixed(2)} per{" "}
              {paymentOption === "yearly"
                ? "year"
                : "month"}
              .
            </p>
            <hr />
            <p style={{ fontStyle: "italic" }}>
              Are you satisfied with this quote ? If so, please confirm your quote via Metamask and proceed to KYC.</p>
              <button
                style={{
                  fontSize: "18px",
                  borderRadius: "8px",
                  fontFamily: "Sora sans-serif",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
                onClick={onConfirmQuote}
              >
                Confirm Quote and go to KYC{" "}
              </button>
          </div>
        ) : null}
        {isLoading === true ? <img alt="spinner" src={spinner} style={{height: "100px", width: "100px", marginTop: "20px"}}></img> : null}
      </div>
    </div>
  );
};

export default Quote;
