import React, {useState} from "react";
import {makeStyles, TextField} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import CircularProgress from '@material-ui/core/CircularProgress';

const {ipcRenderer} = require('electron');

const ConnectToPeerNetworkButton = (props) => {
    const styles = useStyles();
    const [selfAddress, setSelfAddress] = useState(null);
    const [validAddress, setValidAddress] = useState(true);
    const [broadcastAddress, setBroadcastAddress] = useState(null);
    const [validBroadcast, setValidBroadcast] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    ipcRenderer.on('connectToPearNetworkResponse', (event, args) => {
        setIsConnected(true);
        setIsLoading(false);
        props.attachSelfId(args.peerId);
        props.fillPeersList(args.peersList);
    });

    const handleClick = () => {
        setIsLoading(true);
        ipcRenderer.send('connectToPearNetwork', {
            selfAddress: selfAddress,
            broadcastAddress: broadcastAddress
        })
    };

    const checkValidIpAddress = (stringAddress) => {
        let numberOfDots = stringAddress.match(/\./g);
        if (numberOfDots == null || numberOfDots.length < 3) {
            setValidAddress(false)
        } else if (stringAddress.length < 7) {
            setValidAddress(false)
        } else {
            setValidAddress(true)
        }
    };

    const checkValidIpBroadBastAddress = (stringAddress) => {
        let numberOfDots = stringAddress.match(/\./g);
        if (numberOfDots == null || numberOfDots.length < 3) {
            setValidBroadcast(false)
        } else if (stringAddress.length < 7) {
            setValidBroadcast(false)
        } else {
            setValidBroadcast(true)
        }
    };

    return (
        <div className={styles.root}>
            <TextField label={"Machine address"} error={!validAddress}
                       onChange={(event) => {
                           checkValidIpAddress(event.target.value);
                           setSelfAddress(event.target.value)
                       }}/>
            <TextField label={"Broadcast address"} error={!validBroadcast}
                       onChange={(event) => {
                           checkValidIpBroadBastAddress(event.target.value);
                           setBroadcastAddress(event.target.value);
                       }}/>
            <Button style={{
                marginTop: '10px'
            }} disabled={isConnected && !validAddress && !validBroadcast} variant={"contained"}
                    onClick={handleClick}>Connect</Button>
            {isLoading && <CircularProgress className={styles.progress}/>}
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

export default ConnectToPeerNetworkButton;