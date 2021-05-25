import React from "react";
import { Link } from "react-router-dom";
import selfieExample from "./kyc_pictures/pass_censored.png";
import IDExample from "./kyc_pictures/ID_censored.png";

const KYC = () => {
  const loadBackgroundImage = (e) => {
    const selector = `${e.target.id}-element`;
    let image = document.getElementById(selector);

    image.src = URL.createObjectURL(e.target.files[0]);
  };

  return (
    <div className="kyc">
      <div style={{ height: "60px" }}></div>
      <div style={{ textAlign: "left" }}>
        <Link to="/quote">
        <button
          style={{
            fontSize: "14px",
            borderRadius: "8px",
            padding: "6px 12px",
            marginLeft: "2rem",
            marginTop: "1rem",
            fontFamily: "Sora sans-serif",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Back to Quote Engine
        </button>
        </Link>
      </div>
      <div className="section textbox">
        <div className="identity">
          <p style={{ display: "inline-block" }}>
            I) Please upload a copy of your identity document (ID card,
            passport)
          </p>
          <div style={{ display: "inline-block", marginLeft: "15%" }}>
            <input
              type="file"
              accept="image/jpeg, image/png"
              name="image"
              id="identity-img"
              style={{ display: "none" }}
              onChange={loadBackgroundImage}
            />
            <p
              style={{
                marginBottom: 0,
                display: "inline-block",
              }}
            >
              <label
                className="label-upload"
                htmlFor="identity-img"
                style={{
                  fontSize: "14px",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  marginLeft: "2rem",
                  marginTop: "1rem",
                  fontFamily: "Sora sans-serif",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: "solid black",
                  backgroundColor: "rgb(239, 239, 239)",
                }}
              >
                Upload Image
              </label>
            </p>
          </div>
          <div className="pictures">
            <div
              className="example-picture"
              style={{
                display: "inline-block",
                width: "50%",
                textAlign: "center",
              }}
            >
              <h4>Example Picture :</h4>
            </div>
            <div
              className="customer-picture"
              style={{
                display: "inline-block",
                width: "50%",
                textAlign: "center",
              }}
            >
              <h4>Your Picture :</h4>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{ width: "324px", height: "210px", marginRight: "5%" }}
              >
                <img
                  src={IDExample}
                  alt="IDexample"
                  style={{ width: "100%", height: "100%" }}
                ></img>
              </div>
              <div
                style={{ width: "324px", height: "210px", marginLeft: "5%" }}
              >
                <img
                  style={{ width: "100%", height: "100%" }}
                  id="identity-img-element"
                  alt="identity-img-element"
                ></img>
              </div>
            </div>
          </div>
        </div>
        <div className="selfie">
          <p style={{ display: "inline-block" }}>
            II) Please upload a photo of yourself holding your identity document{" "}
          </p>
          <div style={{ display: "inline-block", marginLeft: "15%" }}>
            <input
              type="file"
              accept="image/jpeg, image/png"
              name="image"
              id="selfie-img"
              style={{ display: "none" }}
              onChange={loadBackgroundImage}
            />
            <p
              style={{
                marginBottom: 0,
                display: "inline-block",
              }}
            >
              <label
                className="label-upload"
                htmlFor="selfie-img"
                style={{
                  fontSize: "14px",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  marginLeft: "2rem",
                  marginTop: "1rem",
                  fontFamily: "Sora sans-serif",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: "solid black",
                  backgroundColor: "rgb(239, 239, 239)",
                }}
              >
                Upload Image
              </label>
            </p>
          </div>
          <div className="pictures">
            <div
              className="example-picture"
              style={{
                display: "inline-block",
                width: "50%",
                textAlign: "center",
              }}
            >
              <h4>Example Picture :</h4>
            </div>
            <div
              className="customer-picture"
              style={{
                display: "inline-block",
                width: "50%",
                textAlign: "center",
              }}
            >
              <h4>Your Picture :</h4>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{ width: "324px", height: "210px", marginRight: "5%" }}
              >
                <img
                  src={selfieExample}
                  alt="selfieExample"
                  style={{ width: "100%", height: "100%" }}
                ></img>
              </div>
              <div
                style={{ width: "324px", height: "210px", marginLeft: "5%" }}
              >
                <img
                  style={{ width: "100%", height: "100%" }}
                  id="selfie-img-element"
                  alt="selfie-img-element"
                ></img>
              </div>
            </div>
          </div>
        </div>
        <div
          className="statement"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ width: "482.737px", display: "inline-block" }}>
            <p>
              III) Please upload a photo of yourself holding a paper with the
              following <b>handwritten</b> statement : "
              <i>I would like to apply for a Cherish Life Insurance policy</i>"
            </p>
          </div>
          <div
            style={{
              display: "inline-block",
              width: "40%",
            }}
          >
            <input
              type="file"
              accept="image/jpeg, image/png"
              name="image"
              id="statement-img"
              style={{ display: "none" }}
              onChange={loadBackgroundImage}
            />
            <p
              style={{
                marginBottom: 0,
                marginTop: 0,
                display: "inline-block",
              }}
            >
              <label
                className="label-upload"
                htmlFor="statement-img"
                style={{
                  fontSize: "14px",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  marginLeft: "9.5rem",
                  marginTop: "1rem",
                  fontFamily: "Sora sans-serif",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: "solid black",
                  backgroundColor: "rgb(239, 239, 239)",
                }}
              >
                Upload Image
              </label>
            </p>
          </div>
        </div>
        <div className="pictures">
          <div
            className="example-picture"
            style={{
              display: "inline-block",
              width: "50%",
              textAlign: "center",
            }}
          >
            <h4>Example Picture :</h4>
          </div>
          <div
            className="customer-picture"
            style={{
              display: "inline-block",
              width: "50%",
              textAlign: "center",
            }}
          >
            <h4>Your Picture :</h4>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ width: "324px", height: "210px", marginRight: "5%" }}>
              <img
                src={IDExample}
                alt="IDExample"
                style={{ width: "100%", height: "100%" }}
              ></img>
            </div>
            <div style={{ width: "324px", height: "210px", marginLeft: "5%" }}>
              <img
                style={{ width: "100%", height: "100%" }}
                id="statement-img-element"
                alt="statement-img-element"
              ></img>
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: "2rem",
              marginBottom: "2rem",
            }}
          >
            <Link to="/disclaimer">
              <button
                style={{
                  fontSize: "18px",
                  borderRadius: "8px",
                  fontFamily: "Sora sans-serif",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Submit KYC{" "}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYC;
