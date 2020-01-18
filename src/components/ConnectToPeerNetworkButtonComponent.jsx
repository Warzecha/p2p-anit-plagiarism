import React, {useState} from "react";
import {makeStyles} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import CircularProgress from '@material-ui/core/CircularProgress';
import Peer from "../socket/Peer";

const uuid = require('uuid/v1');

const ConnectRoPeerNetworkButton = (props) => {
    const styles = useStyles();
    let peer = null;

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        peer = new Peer("0.0.0.0", "0.0.0.0");
        peer.bindPeer();

        setIsConnected(true);
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            peer.broadcastMessage();
            props.attachSelfId(peer.peerId);
            props.fillPeersList(customPeersList);
        }, 2000);

        let customPeersList = new Set();
        customPeersList.add(peer.peerId);
        customPeersList.add(uuid().toString());
        customPeersList.add(uuid().toString());

    };

    return (
        <div className={styles.root}>
            <Button disabled={isConnected} variant={"contained"} onClick={handleClick}>Connect</Button>
            {isLoading && <CircularProgress className={styles.progress}></CircularProgress>}
        </div>
    )

};

const useStyles = makeStyles(() => ({
    root: {
        align: 'center'
    },
    progress: {
        position: 'absolute',
        top: '50%',
        left: '50%',
    }
}));

export default ConnectRoPeerNetworkButton;