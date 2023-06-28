import React, { useState } from "react";
import Flipbook from "./components/Flipbook";
import { Provider } from "unstated";
import "./App.css";

function App() {
  return (
    <Provider>
      <div id="app">
        <Flipbook/>
      </div>
    </Provider>
  );
}

export default App;
