import React, {useState} from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ComputerIcon from '@material-ui/icons/Computer';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import {makeStyles} from "@material-ui/core";
import List from "@material-ui/core/List";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

const {ipcRenderer} = require('electron');

const CurrentNetworkListComponent = (props) => {

    const styles = useStyles();
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const {peersList, selfId} = props;

    ipcRenderer.on('connectToPearNetworkResponse', (event, args) => {
        setIsConnected(true);
        setIsLoading(false);
        props.attachSelfId(args.peerId);
    });

    ipcRenderer.on('updatePeersNetwork', (event, args) => {
        props.fillPeersList(args.currentNetworkPeers)
    });

    const handleClick = () => {
        setIsLoading(true);
        ipcRenderer.send('connectToPearNetwork')
    };

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
            <Button disabled={isConnected}
                    variant={"contained"}
                    onClick={handleClick}>Connect</Button>

            <List className={styles.listContainer}>
                {getFileList()}
            </List>

            {isLoading && <CircularProgress className={styles.progress}/>}
        </div>
    )
};


const useStyles = makeStyles(() => ({
    listContainer: {

        border: '1px solid black',
        borderRadius: 25,
        marginTop: 20
    },

    root: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        justifyItems: 'center',
        padding: 5,
        marginLeft: 10,
    },
    progress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
    }
}));

export default CurrentNetworkListComponent;
