import React, {useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import DragAndDropComponent from "./DragAndDropComponent";
import FileListComponent from "./FileListComponent";
import {Map} from 'immutable';
import ConnectRoPeerNetworkButton from "./ConnectToPeerNetworkButtonComponent";
import CurrentNetworkListComponent from "./CurrentNetworkListComponent";

const {ipcRenderer} = require('electron');

const StartJobComponent = () => {
    const styles = useStyles();

    const [files, setFiles] = useState(new Map());
    const [peersList, setPeersList] = useState([]);
    const [selfId, setSelId] = useState(null);

    const handleFilesDropped = (newFiles) => {
        let updatedFiles = files;
        Array.from(newFiles).forEach((newFile) => {
            updatedFiles = updatedFiles.set(newFile.path, newFile);
        });
        setFiles(updatedFiles);
        parseFiles(newFiles)
    };

    let parseFiles = (newFiles) => {

        let data = {
            files: []
        };

        Array.from(newFiles).map((file) => {
            data.files.push({
                'path': file.path,
                'name': file.name
            })
        });

        ipcRenderer.send('parseFile', data);
    };

    const handleFileDeleted = (file) => {
        setFiles(files.delete(file.path))
    };

    const fillPeersList = (peers) => {
        let updatedList = [];
        Array.from(peers).forEach((peer) =>
            updatedList.push(peer)
        );
        setPeersList(updatedList);

    };

    const attachSelfId = (peerId) => {
        setSelId(peerId);
    };

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Start job</Typography>
            <div className={styles.networkList}>
                <ConnectRoPeerNetworkButton peersList={peersList} fillPeersList={fillPeersList}
                                            attachSelfId={attachSelfId}/>
                <CurrentNetworkListComponent peersList={peersList} selfId={selfId}/>
            </div>
            <div className={styles.fileInputContainer}>
                <DragAndDropComponent files={files} onFilesDropped={handleFilesDropped}/>
                <FileListComponent files={files} onFileDeleted={handleFileDeleted}/>
            </div>

        </div>
    );
};

const useStyles = makeStyles(() => ({
    root: {
        // display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },

    fileInputContainer: {
        width: '60%',
        float: 'left',
        alignItems: 'center',
        marginLeft: '5%'
    },

    heading: {
        fontSize: 20
    },

    networkList: {
        display: 'flex',
        spacing: '10%',
        alignItems: 'center',
        flexDirection: 'column',
        float: 'right',
        width: '30%'
    }

}));

export default StartJobComponent;