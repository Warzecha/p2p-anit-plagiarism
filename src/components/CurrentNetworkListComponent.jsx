import React from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ComputerIcon from '@material-ui/icons/Computer';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import {makeStyles} from "@material-ui/core";
import List from "@material-ui/core/List";

const CurrentNetworkListComponent = (props) => {

    const styles = useStyles();

    const {peersList, selfId} = props;

    const getFileList = () => Array.from(peersList).map((peer, index) => (
        <ListItem key={index}>
            <ListItemIcon>
                {peer.peerId === selfId ? <AccountBoxIcon/> : <ComputerIcon/>}
            </ListItemIcon>
            <ListItemText
                primary={peer.peerId === selfId ? "This machine" : `${peer.peerId.slice(0, 3)}...${peer.peerId.slice(peer.peerId.length - 4, peer.peerId.length - 1)}`}/>
        </ListItem>));


    return (
        <div className={styles.root}>
            <List>
                {getFileList()}
            </List>
        </div>
    )
};


const useStyles = makeStyles(() => ({
    root: {
        border: '2px solid black',
        borderRadius: 25,
        width: '80%',
        marginTop: '10%'
    }
}));

export default CurrentNetworkListComponent;