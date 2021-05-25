import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="notfound">
      <div style={{ height: "60px" }}></div>

      <div className="title">
        <h1 style={{ fontWeight: "700" }}>404 Page Not Found </h1>
      </div>
      <div>
        <Link to="/">
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
            Go back to Home page{" "}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
