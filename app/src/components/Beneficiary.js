import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { saveBeneficiaryData } from "../actions/beneficiaryActions";


const Beneficiary = (props) => {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [ethereumWallet, setEthereumWallet] = useState("");
    const [payoutShare, setPayoutShare] = useState(0);

    const dispatch = useDispatch();


    const onSaveBeneficiaryData = async (e) => {
        e.preventDefault();
        dispatch(
            saveBeneficiaryData({
                beneficiaryNumber: props.beneficiaryNumber,
              firstName,
              lastName,
              email,
              ethereumWallet,
              payoutShare,
            })
          );
        window.alert(`Data for Beneficiary ${props.beneficiaryNumber} saved !`);
    }

    return (
        <div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <h4>{`Beneficiary ${props.beneficiaryNumber}`}</h4>
              <div
                style={{
                  width: "150px",
                  display: "inline-block",
                  textAlign: "left",
                }}
              >
                <label htmlFor="firstName">First Name</label>
              </div>
              <div style={{ width: "100px", display: "inline-block" }}>
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
                  width: "150px",
                  display: "inline-block",
                  textAlign: "left",
                }}
              >
                <label htmlFor="lastName">Last Name</label>
              </div>
              <div style={{ width: "100px", display: "inline-block" }}>
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
                  width: "150px",
                  display: "inline-block",
                  textAlign: "left",
                }}
              >
                <label htmlFor="email">Email</label>
              </div>
              <div style={{ width: "100px", display: "inline-block" }}>
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
                  width: "150px",
                  display: "inline-block",
                  textAlign: "left",
                }}
              >
                <label htmlFor="age">Ethereum Wallet</label>
              </div>
              <div style={{ width: "100px", display: "inline-block" }}>
                <input
                  type="text"
                  className="form-control"
                  name="ethereumwallet"
                  required
                  onChange={(e) => setEthereumWallet(e.target.value)}
                  value={ethereumWallet}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  width: "150px",
                  display: "inline-block",
                  textAlign: "left",
                }}
              >
                <label htmlFor="age">Payout Share (in %)</label>
              </div>
              <div style={{ width: "100px", display: "inline-block" }}>
                <input
                  type="number"
                  className="form-control"
                  name="payoutshare"
                  required
                  onChange={(e) => setPayoutShare(e.target.value)}
                  value={payoutShare}
                />
              </div>
            </div>
            <button
                        style={{
                        alignContent: "center",
                        cursor: "pointer",
                        marginBottom: "1rem"
                        }}
                        onClick={onSaveBeneficiaryData}
                    >
                        Save Beneficiary Data{" "}
            </button>
          </div>
    )

}

export default Beneficiary;