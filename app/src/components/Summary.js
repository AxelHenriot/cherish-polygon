import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";


const Summary = (props) => {

    const [paymentOption, setPaymentOption] = useState("");
    const [premiumAmount, setPremiumAmount] = useState(0);
    const [payout, setPayout] = useState(0);


    const ownerData = useSelector(state => state.quote);
    const beneficiaries = useSelector(state => state.beneficiaries);
    const {web3, policyContract, policyOwnerWallet} = useSelector(state => state.web3Data);

    const onFetchPolicyData = async(e) => {
        let policyIDhash = web3.utils.keccak256(ownerData.ownerData.ownerUUID);

        let policy = await policyContract.methods.policyRegister(policyIDhash).call({ from: policyOwnerWallet });
        setPaymentOption(policy.selectedPaymentOption);
        setPremiumAmount(web3.utils.fromWei(policy.premiumAmount));
        setPayout(web3.utils.fromWei(policy.payout));
    }

    useEffect(() => {
        onFetchPolicyData();
      }, []);

  return (
    <div className="summary">
      <div style={{ height: "60px" }}></div>

      <div className="title">
        <h1 style={{ fontWeight: "700" }}>Policy Summary</h1>
      </div>
      <div className="section">
        <div className="textbox">
          <h3>Personal Data</h3>
          <p>
            First name : <i>{ownerData.ownerData.firstName}</i>
          </p>
          <p>
            Last name : <i>{ownerData.ownerData.lastName}</i>
          </p>
          <p>
            Age : <i>{ownerData.ownerData.age}</i>
          </p>
          <p>
            Sex : <i>{ownerData.ownerData.sex}</i>
          </p>
          <p>
            Email address : <i>{ownerData.ownerData.email}</i>
          </p>
          <h3>Policy Parameters</h3>
          <p>
            Policy ID : <i>{ownerData.ownerData.ownerUUID}</i>
          </p>
          <p>
            Payment option : <i>{paymentOption === "0" ? "Monthly" : "Yearly"}</i>
          </p>
          <p>
            Policy premium : <i>${parseFloat(premiumAmount).toFixed(2)}</i>
          </p>
          <p>
            Policy payout : <i>${parseFloat(payout).toFixed(2)}</i>
          </p>
          <p>Policy duration : <i>5 years</i></p>
          <h3>Beneficiaries</h3>
          {beneficiaries.beneficiaryParameters.map(beneficiary => (
              <div>
              <p style={{fontWeight: "bold" }}>Beneficiary {beneficiary.beneficiaryNumber}</p>
              <p>First Name : <i>{beneficiary.firstName}</i></p>
              <p>Last Name : <i>{beneficiary.lastName}</i></p>
              <p>Email : <i>{beneficiary.email}</i></p>
              <p>Ethereum Wallet : <i>{beneficiary.ethereumWallet}</i></p>
              <p>Payout Share : <i>{beneficiary.payoutShare}%</i></p>
              </div>
          ))}
          <h3>Next Steps</h3>
          <p>
            Our KYC partner will review the ID documents that you submitted during the KYC step and confirm their authenticity.
          </p>
          <p>The beneficiaries of your life insurance policy must also confirm their role as recipients. You can send them the following link where they will be able to sign their confirmation : </p>
            <Link to={`/confirmation/${props.match.params.id}`}>Confirmation for Beneficiaries</Link>
            <p>You can check the progress of the status of your policy in the link below.</p>
        </div>
      </div>
      <div>
        <Link to={`/policy`}>
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
          >
            Check status of your policy{" "}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Summary;
