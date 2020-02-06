import React from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import MainNavigation from "./navigation/MainNavigation";
import useMainStyle from "./styles/MainStyle";
import CssBaseline from "@material-ui/core/CssBaseline";
import Sidebar from "./components/Sidebar";

function App() {
    const classes = useMainStyle();

    return (
        <div className={classes.root}>
            <CssBaseline/>
            <Router basename={process.env.PUBLIC_URL}>
                {/*<Sidebar/>*/}
                <MainNavigation/>
            </Router>
        </div>
    );
}

export default App;
