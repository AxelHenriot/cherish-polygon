import React, { useState } from "react";
import { useSelector } from "react-redux";

import Beneficiary from "./Beneficiary";

import spinner from "../spinner.png";


const Beneficiaries = (props) => {

    const [beneficiaryCounter, setBeneficiaryCounter] = useState(1);
    const [beneficiariesArray, setBeneficiariesArray] = useState([<Beneficiary beneficiaryNumber = {beneficiaryCounter} key={beneficiaryCounter}></Beneficiary>]);
    const [isLoading, setIsLoading] = useState(false);

    const ownerData = useSelector(state => state.quote);
    const beneficiaries = useSelector(state => state.beneficiaries);
    const {web3, policyContract, policyOwnerWallet} = useSelector(state => state.web3Data);

    const onSubmitBeneficiariesParameters = async (e) => {
        e.preventDefault();
        
        let payoutCheck = beneficiaries.beneficiaryParameters.map(el => parseInt(el.payoutShare)).reduce((accumulator, currentValue) => accumulator + currentValue);
        if(payoutCheck !== 100) {
          window.alert(`The sum of payout shares must be equal to 100%. Current result : ${payoutCheck}%`);
        } else {
          setIsLoading(true);
          // get policyIDhash  
          let policyIDhash = web3.utils.keccak256(ownerData.ownerData.ownerUUID);

          // create arrays for beneficiary addresses and beneficiary payout shares (number format)
          let beneficiariesAddressArray = beneficiaries.beneficiaryParameters.map(el => el.ethereumWallet);
          let beneficiariesPayoutShareArray = beneficiaries.beneficiaryParameters.map(el => parseInt(el.payoutShare));

          // send tx to setBeneficiaries method
          await policyContract.methods.setBeneficiaries(policyIDhash, beneficiariesAddressArray, beneficiariesPayoutShareArray).send({ from: policyOwnerWallet });
          window.alert(`The beneficiary parameters have been correctly entered into the system, you will know be taken to a summary of your policy.`);
          setIsLoading(false);
          props.history.push(`/summary/${ownerData.ownerData.ownerUUID}`);
        }
      };
    
    const addBeneficiary = async(e) => {
      e.preventDefault();
      if(beneficiaryCounter >= 5) {
        window.alert("The number of beneficiaries for a single policy is limited to 5.");
      } else {
      setBeneficiariesArray([...beneficiariesArray, <Beneficiary beneficiaryNumber = {beneficiaryCounter + 1} key={beneficiaryCounter + 1}></Beneficiary>]);
      setBeneficiaryCounter(beneficiaryCounter + 1);
      }
    }
  
    return (
      <div className="beneficiaries">
                <div style={{ height: "60px" }}></div>
          <h1>Policy Owner & Beneficiaries</h1>

          <p style={{ fontStyle: "italic" }}>
        Please fill in the information regarding Beneficiaries.
        </p>

    <div className="beneficiariesbox">
        <h3>Wallet and Beneficiary Parameters</h3>
        <form onSubmit={onSubmitBeneficiariesParameters}>
          <div>
            {beneficiariesArray}
          </div>
          <div className="buttons">
          <button
                        style={{
                          fontSize: "18px",
                          borderRadius: "8px",
                          fontFamily: "Sora sans-serif",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                        onClick={addBeneficiary}
                    >
                        Add Beneficiary{" "}
            </button>
          <input
          style={{
            fontSize: "18px",
                        borderRadius: "8px",
                        fontFamily: "Sora sans-serif",
                        fontWeight: "700",
                        cursor: "pointer",
            marginLeft: "5%"
          }}
            type="submit"
            value="Submit"
            className="btn btn-primary btn-block"
          />
          </div>
        </form>
        {isLoading === true ? <img alt="spinner" src={spinner} style={{height: "100px", width: "100px", marginTop: "20px"}}></img> : null}
        </div>
      </div>
    );
  };
  
  export default Beneficiaries;