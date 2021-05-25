import React, { useReducer } from "react";
import { Provider } from "react-redux";
import { createStore, combineReducers } from 'redux';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

// Reducers
import * as quoteReducer from "./reducers/quoteReducer";
import * as beneficiariesReducer from "./reducers/beneficiariesReducer";
import * as web3Reducer from "./reducers/web3Reducer";

import Homepage from "./components/Homepage";
import AppNavbar from "./components/AppNavbar";
import Quote from "./components/Quote";
import KYC from "./components/KYC";
import Disclaimer from "./components/Disclaimer";
import Beneficiaries from "./components/Beneficiaries";
import Summary from "./components/Summary";
import Confirmation from "./components/Confirmation";
import Policy from "./components/Policy";
import Claim from "./components/Claim";
import Dashboard from "./components/Dashboard";
import NotFound from "./components/NotFound";
import "./App.css";

const appReducers = combineReducers({
  quote: quoteReducer.quoteReducer,
  beneficiaries: beneficiariesReducer.beneficiariesReducer,
  web3Data: web3Reducer.web3Reducer
});

// to replace normal store
const store = createStore(
  appReducers,
);

const App = () => {
  const [quoteState, dispatchQuote] = useReducer(
    quoteReducer.quoteReducer,
    quoteReducer.initialState
  );

  const [beneficiariesState, dispatchBeneficiaries] = useReducer(
    beneficiariesReducer.beneficiariesReducer,
    beneficiariesReducer.initialState
  );

  const [web3State, dispatchWeb3] = useReducer(
    web3Reducer.web3Reducer,
    web3Reducer.initialState
  );

  return (
    <Provider store={store}>
        <Router>
          <div className="App">
            <AppNavbar />
            <Switch>
              <Route exact path="/" component={Homepage} />
              <Route exact path="/quote" component={Quote} />
              <Route exact path="/kyc" component={KYC} />
              <Route exact path="/disclaimer" component={Disclaimer} />
              <Route exact path="/beneficiaries" component={Beneficiaries} />
              <Route exact path="/summary/:id" component={Summary} />
              <Route exact path="/confirmation/:id" component={Confirmation} />
              <Route exact path="/policy" component={Policy} />
              <Route exact path="/claim" component={Claim} />
              <Route exact path="/dashboard" component={Dashboard} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </Router>
    </Provider>
  );
};

export default App;
