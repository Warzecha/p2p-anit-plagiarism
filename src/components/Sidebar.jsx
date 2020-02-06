import React from 'react';
import Drawer from "@material-ui/core/Drawer";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import useMainStyle from "../styles/MainStyle";
import {Assignment, AddBox} from "@material-ui/icons";
import {Link} from "react-router-dom";

function ListItemLink(props) {
    const {icon, name, to} = props;
    const renderLink = React.useMemo(
        () =>
            React.forwardRef((itemProps, ref) => (
                <Link to={to} {...itemProps} ref={ref}/>
            )),
        [to],
    );

    return (
        <li>
            <ListItem button component={renderLink} onClick={props.onItemClicked}>
                {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
                <ListItemText primary={name}/>
            </ListItem>
        </li>
    );
}

const Sidebar = (props) => {
    const classes = useMainStyle();

    const drawerContent = (
        <div>
            <List>
                {
                    menuItems.map((item, index) => {
                        return <ListItemLink {...item}
                                             key={index}
                        />
                    })
                }
            </List>
        </div>
    );
    return (
        <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <div className={classes.toolbar}/>
            {drawerContent}
        </Drawer>
    );
};

const menuItems = [
    {
        "name": "Start Job",
        "icon": <AddBox/>,
        "to": "/startJob"
    },
    {
        "name": "Active Jobs",
        "icon": <Assignment/>,
        "to": "/activeJobs"
    },
];

export default Sidebar;
