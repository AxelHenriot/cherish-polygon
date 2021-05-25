import React from "react";
import { Link } from "react-router-dom";

const AppNavbar = () => {
  return (
    <nav
      className="navbar"
      style={{
        position: "fixed",
        display: "block",
        width: "100%",
        background: "white",
        border: "2px solid black",
        paddingBottom: "2px",
        paddingTop: "2px",
      }}
    >
      <ul
        style={{
          margin: "0",
          fontWeight: "500",
          textAlign: "justify",
          marginLeft: "20%",
        }}
      >
        <Link to="/">
          <li style={{ display: "inline-block", color: "black" }}>Home</li>
        </Link>
        <Link to="/policy">
          <li
            style={{
              display: "inline-block",
              marginLeft: "10%",
              color: "black",
            }}
          >
            My Policy
          </li>
        </Link>
        <Link to="/claim">
          <li
            style={{
              display: "inline-block",
              marginLeft: "10%",
              color: "black",
            }}
          >
            Claims
          </li>
        </Link>
        <Link to="/dashboard">
          <li
            style={{
              display: "inline-block",
              marginLeft: "10%",
              color: "black",
            }}
          >
            Dashboard
          </li>
        </Link>
        <Link to="/quote">
          <li
            style={{
              display: "inline-block",
              marginLeft: "10%",
              color: "black",
            }}
          >
            <button
              style={{
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
          </li>
        </Link>
      </ul>
    </nav>
  );
};

export default AppNavbar;
