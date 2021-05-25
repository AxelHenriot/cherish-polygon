import React from "react";
import { Link } from "react-router-dom";
import logo from "./logo/newborn-baby-sketches-22-removebg-preview.png";

const Homepage = () => {

  return (
    <div className="main">
      <div className="title">
        <img
          src={logo}
          alt="cherish-logo"
          width="200px"
          height="200px"
          style={{ marginTop: "64px" }}
        />
        <h1 style={{ fontFamily: "Petit Formal Script" }}>Cherish</h1>
        <p style={{ fontFamily: "Petit Formal Script", fontWeight: "700" }}>
          Safe, Fair and Transparent Life Insurance
        </p>
      </div>
      <div className="section">
        <div className="textbox">
          <h3>What is Life Insurance ?</h3>
          <p>
            It is a type of insurance that helps to financially support your
            loved ones should you pass away. Life insurance pays out a lump sum
            to the beneficiaries if you die during the term of the policy. It is
            designed to help give them financial security after you are gone by
            helping to pay joint debts (such as a mortgage), cover their living
            expenses or simply pay for funeral expenses.
          </p>
          <h3>Why choose a life insurance policy through Cherish ?</h3>
          <p>
            Cherish is a new type of safe, fair and transparent Life Insurance.
            Traditional life insurance policies often suffer from long execution
            delays due to lost or missing documents, difficulties in finding the
            beneficiaries or even deliberate slow-walking from the part of the
            insurer before benefits are paid out.
          </p>
          <p>
            Moreover, policyholders and beneficiaries have little clarity about
            the financial health and the trustworthiness of the insurer with
            whom they are signing an important, long-term contract. Our life
            insurance policies are built on the public Ethereum platform,
            allowing all stakeholders to know at all times the status of their
            policy and the financial reserves of the Cherish mutual, while
            guaranteeing that the benefits will be paid immediately should the
            contractual conditions be met.
          </p>
          <h3>How does Cherish's Life Insurance work ?</h3>
          <p>
            The first step consists in assessing your coverage needs and getting
            a corresponding quote according to your payment preferences. You
            will then be invited to supply contact information about yourself
            and your beneficiaries in order to initiate a policy. After you and
            your beneficiaries have confirmed their participation in the policy
            contract and the first payment has been made, the policy becomes
            active.
          </p>
          <p>
            Your life insurance policy is now live on the Ethereum network and
            can be reviewed or adjusted at any moment. It remains in force as
            long it receives the agreed scheduled payments. The Cherish platform
            is connected to your country's CRVS system (Civil Registration and
            Vital Statistics) and should you appear in it as having passed away,
            the benefit payments will become immediately available to your
            beneficiaries.
          </p>
          <h3>What is covered under my policy ?</h3>
          <p>
            Our standard Life Insurance offering is a term life policy of 5
            years with fixed premiums and a single lump sum benefit payment upon
            confirmed death of the policyholder. It remains valid for 30 days
            after a missed payment, after which it will be considered void.
          </p>
          <p>
            Our policies cover all causes of death, in any location or
            circumstance, starting one year after the beginning of the policy.
            Your beneficiaries will not be asked to provide additional documents
            or paperwork.
          </p>
        </div>
      </div>
      <div>
        <Link to="/quote">
          <button
            style={{
              marginBottom: "4rem",
              fontSize: "18px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Get an instant quote
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Homepage;
