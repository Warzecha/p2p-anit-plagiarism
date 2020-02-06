import React, {useState} from "react";
import {makeStyles, TextField} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import CircularProgress from '@material-ui/core/CircularProgress';

const {ipcRenderer} = require('electron');

const ConnectToPeerNetworkButton = (props) => {
    const styles = useStyles();
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className={styles.root}>
            <Button style={{
                marginTop: '10px'
            }}
                    // disabled={isConnected}
                    variant={"contained"}
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
