import React, {useState, useEffect} from "react";

import spinner from "../spinner.png";
import { abi } from "../contracts/PolicyManagement.json";

import Web3 from "web3";
import Web3Modal from "web3modal";

const providerOptions = {
};

const web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true, // optional
  providerOptions // required
});

const Confirmation = (props) => {

    const [isLoading, setIsLoading] = useState(false);
    const [beneficiaryWallet, setBeneficiaryWallet] = useState("");
    const [web3, setWeb3] = useState({});
    const [policyContract, setPolicyContract] = useState({});


    const onConfirmBeneficiary = async(e) => {
        e.preventDefault();
        setIsLoading(true);
        let policyIDhash = web3.utils.keccak256(props.match.params.id);
        await policyContract.methods.confirmBeneficiary(policyIDhash).send({ from: beneficiaryWallet });
        window.alert(`You have been correctly registered as a beneficiary of Cherish Policy n° ${props.match.params.id}. You will now be taken to the Home page.`);
        setIsLoading(false);
        props.history.push("/");
    }

    const onConnect = async(e) => {

        // instantiating the web3 object
        const provider = await web3Modal.connect();
        const web3 = new Web3(provider);
        setWeb3(web3);
        // instantiating the Policy Contract object
        // const policyContractAddress = window.prompt("Please enter the address of the Policy Management contract"); // testing purpose only
        const policyContractAddress = "0x8571Cc61e6cd98502798379d445faF6DeA7395a4";
        const policyContract = new web3.eth.Contract(abi, policyContractAddress);
        setPolicyContract(policyContract);
        // fetching user account
        const accounts = await web3.eth.getAccounts();
        setBeneficiaryWallet(accounts[0]);
      } 

    useEffect(() => {
        onConnect();
      }, []);

  return (
    <div className="confirmation">
      <div style={{ height: "60px" }}></div>

      <div className="title">
        <h1 style={{ fontWeight: "700" }}>Policy Confirmation</h1>
        <p style={{ fontStyle: "italic" }}>
        Welcome to the Cherish platform ! You have been designated as a beneficiary of the policy n°{props.match.params.id}.
        <br/>
        <br/>
      Please connect your Ethereum wallet, read the Terms & Conditions and confirm your role as beneficiary.
      </p>
      </div>
      <div style={{ height: "20px" }}></div>
        <div className="beneficiary" style={{textAlign:"left", marginLeft: "20%"}}>
            <h3>Beneficiary Wallet : {beneficiaryWallet.length > 0 ? beneficiaryWallet : ""}</h3>
        </div>
        <div className="section">
        <div className="textbox">
          <h3>Policy Expiry</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Nisl
            nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit. Sit amet
            venenatis urna cursus eget nunc. Consectetur adipiscing elit ut
            aliquam purus sit amet luctus venenatis. Venenatis lectus magna
            fringilla urna. Et netus et malesuada fames ac turpis egestas. Ut
            consequat semper viverra nam libero justo laoreet sit amet. Ornare
            quam viverra orci sagittis eu volutpat odio. Morbi quis commodo odio
            aenean sed adipiscing. Velit laoreet id donec ultrices tincidunt
            arcu non sodales neque. Nullam non nisi est sit amet facilisis magna
            etiam. Senectus et netus et malesuada fames ac. Donec et odio
            pellentesque diam volutpat commodo sed. Scelerisque felis imperdiet
            proin fermentum. Quis imperdiet massa tincidunt nunc. Lacus luctus
            accumsan tortor posuere ac. Amet consectetur adipiscing elit ut
            aliquam purus sit amet. Rhoncus mattis rhoncus urna neque.
          </p>
          <h3>Policy Cancellation</h3>
          <p>
            Pellentesque nec nam aliquam sem. Massa massa ultricies mi quis
            hendrerit dolor magna eget. Quam adipiscing vitae proin sagittis
            nisl rhoncus mattis rhoncus urna. Faucibus vitae aliquet nec
            ullamcorper sit. Morbi tristique senectus et netus et malesuada.
            Quam nulla porttitor massa id neque. Non blandit massa enim nec dui
            nunc mattis enim ut. Nunc eget lorem dolor sed viverra ipsum. Risus
            ultricies tristique nulla aliquet enim tortor. Eget nunc lobortis
            mattis aliquam faucibus purus in massa tempor. Pretium lectus quam
            id leo. Ornare aenean euismod elementum nisi quis eleifend quam
            adipiscing. Sed enim ut sem viverra aliquet eget sit. Pulvinar etiam
            non quam lacus suspendisse faucibus interdum. Purus sit amet
            volutpat consequat mauris nunc congue nisi vitae. Porttitor rhoncus
            dolor purus non enim praesent elementum facilisis. Volutpat maecenas
            volutpat blandit aliquam. Semper auctor neque vitae tempus quam
            pellentesque nec.
          </p>
          <h3>Claims Management & Fraud</h3>
          <p>
            Ac tincidunt vitae semper quis. Dignissim sodales ut eu sem integer
            vitae justo eget magna. At varius vel pharetra vel turpis nunc eget
            lorem dolor. Urna et pharetra pharetra massa massa ultricies. Vel
            eros donec ac odio tempor orci dapibus ultrices in. Dignissim cras
            tincidunt lobortis feugiat vivamus. Congue quisque egestas diam in
            arcu cursus euismod quis. Arcu felis bibendum ut tristique et
            egestas quis ipsum. Elit scelerisque mauris pellentesque pulvinar
            pellentesque habitant morbi. Fringilla ut morbi tincidunt augue
            interdum velit euismod in pellentesque. Urna nec tincidunt praesent
            semper feugiat nibh sed pulvinar.
          </p>
          <h3>Best Effort Policy</h3>
          <p>
            Sed risus pretium quam vulputate. Lectus sit amet est placerat.
            Consequat interdum varius sit amet mattis vulputate. Vitae tortor
            condimentum lacinia quis vel. Aliquet eget sit amet tellus cras.
            Quis vel eros donec ac odio tempor orci dapibus. Eleifend donec
            pretium vulputate sapien nec sagittis. Egestas pretium aenean
            pharetra magna ac placerat. Ac tincidunt vitae semper quis lectus
            nulla. Sit amet purus gravida quis blandit turpis. Eu tincidunt
            tortor aliquam nulla facilisi cras. Tempus urna et pharetra pharetra
            massa. Eget velit aliquet sagittis id consectetur purus ut faucibus
            pulvinar. Malesuada pellentesque elit eget gravida cum sociis
            natoque penatibus. Gravida neque convallis a cras semper. Dignissim
            convallis aenean et tortor at.
          </p>
        </div>
      </div>
      <div>
          <button
            style={{
              marginBottom: "1rem",
              fontSize: "14px",
              borderRadius: "8px",
              padding: "11px 20px",
              fontFamily: "Sora sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={onConfirmBeneficiary}
          >
            I have acknowledged and accepted the Cherish Terms & Conditions, and hereby confirm my role as a beneficiary of policy n°{props.match.params.id}
          </button>
      </div>
      {isLoading === true ? <img alt="spinner" src={spinner} style={{height: "100px", width: "100px", marginTop: "20px"}}></img> : null}
    </div>
  );
};

export default Confirmation;
