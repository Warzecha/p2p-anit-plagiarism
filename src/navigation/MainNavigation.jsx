import React from "react";
import {
    Switch,
    Route,
} from "react-router-dom";

import useMainStyle from "../styles/MainStyle";
import StartJobComponent from "../components/startJob/StartJobComponent";
import ActiveJobsComponent from "../components/activeJobs/ActiveJobsComponent";

export default function MainNavigation() {
    const classes = useMainStyle();

    return (
        <main className={classes.content}>
            <Switch>
                <Route path="/">
                    <StartJobComponent/>
                </Route>
            </Switch>
        </main>)

}
